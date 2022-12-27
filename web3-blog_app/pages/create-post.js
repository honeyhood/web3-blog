import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { css } from '@emotion/css';
import { ethers } from 'ethers';
import { Web3Storage } from 'web3.storage';
import { contractAddress } from '../config';

import Blog from '../artifacts/contracts/Blog.sol/Blog.json';
import Image from 'next/image';

const client = new Web3Storage({
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDE2ZjIzODc3MWM5QjFmYzVBMDgxQWIwZjk4ZTlEYThiRUQwQzIzNTYiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NzAyODEzMzg3OTUsIm5hbWUiOiJ3ZWIzLWJsb2cifQ.9yuIjoKD14JyfFRxaqA6asFe0c--dcDCh7MUZCgzV6E',
});

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), {
  ssr: false,
});

const initialState = { title: '', content: '' };

function CreatePost() {
  const [post, setPost] = useState(initialState);
  const [image, setImage] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const fileRef = useRef(null);
  const { title, content } = post;
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      setLoaded(true);
    }, 500);
  }, []);

  async function savePostToIpfs() {
    try {
      const blob = new Blob([JSON.stringify(post)], {
        type: 'application/json',
      });
      const filePost = [new File([blob], 'post')];
      const added = await client.put(filePost, { wrapWithDirectory: false });
      console.log('stored files with cid:', added);
      return added;
    } catch (err) {
      console.log('error: ', err);
    }
  }

  async function savePost(hash) {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, Blog.abi, signer);
      console.log('contract: ', contract);
      try {
        const val = await contract.createPost(post.title, hash);
        console.log('val: ', val);
      } catch (err) {
        console.log('Error: ', err);
      }
    }
  }

  async function createNewPost() {
    if (!title || !content) return;
    const hash = await savePostToIpfs();
    await savePost(hash);
    router.push(`/`);
  }

  async function handleFileChange(e) {
    const uploadedFile = e.target.files;
    if (!uploadedFile) return;
    setImageLoading(true);
    const added = await client.put(uploadedFile, { wrapWithDirectory: false });
    setPost((state) => ({ ...state, coverImage: added }));
    setImage(uploadedFile[0]);
    setImageLoading(false);
  }

  function triggerOnChange() {
    fileRef.current.click();
  }

  return (
    <div className={container}>
      {imageLoading && <p>Loading...</p>}
      {image && (
        <Image
          className={coverImageStyle}
          src={URL.createObjectURL(image)}
          alt="postImage"
          width={800}
          height={500}
        />
      )}
      <input
        onChange={(e) => setPost({ ...post, title: e.target.value })}
        name="title"
        placeholder="Give it a title ..."
        value={post.title}
        className={titleInputStyle}
      />
      <SimpleMDE
        className={mdEditor}
        placeholder="What's on your mind?"
        value={post.content}
        onChange={(value) => setPost({ ...post, content: value })}
      />
      {loaded && (
        <>
          <button className={button} type="button" onClick={createNewPost}>
            Publish
          </button>
          <button onClick={triggerOnChange} className={button}>
            Add cover image
          </button>
        </>
      )}
      <input
        id="selectImage"
        className={hiddenInput}
        type="file"
        onChange={handleFileChange}
        ref={fileRef}
      />
    </div>
  );
}

const hiddenInput = css`
  display: none;
`;

const coverImageStyle = css`
  max-width: 800px;
`;

const mdEditor = css`
  margin-top: 40px;
`;

const titleInputStyle = css`
  margin-top: 40px;
  border: none;
  outline: none;
  background-color: inherit;
  font-size: 44px;
  font-weight: 600;
  &::placeholder {
    color: #999999;
  }
`;

const container = css`
  width: 800px;
  margin: 0 auto;
`;

const button = css`
  background-color: #fafafa;
  outline: none;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  margin-right: 10px;
  font-size: 18px;
  padding: 16px 70px;
  box-shadow: 7px 7px rgba(0, 0, 0, 0.1);
`;

export default CreatePost;
