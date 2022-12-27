import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import { css } from '@emotion/css';
import dynamic from 'next/dynamic';
import { ethers } from 'ethers';
import { Web3Storage } from 'web3.storage';

import { contractAddress } from '../../config';
import Blog from '../../artifacts/contracts/Blog.sol/Blog.json';

const { NEXT_PUBLIC_ENVIRONMENT, API_URL } = process.env;

const client = new Web3Storage({
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDE2ZjIzODc3MWM5QjFmYzVBMDgxQWIwZjk4ZTlEYThiRUQwQzIzNTYiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NzAyODEzMzg3OTUsIm5hbWUiOiJ3ZWIzLWJsb2cifQ.9yuIjoKD14JyfFRxaqA6asFe0c--dcDCh7MUZCgzV6E',
});
const ipfsURI = '.ipfs.w3s.link';

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), {
  ssr: false,
});

export default function EditPost() {
  const [post, setPost] = useState(null);
  const [editing, setEditing] = useState(true);

  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    fetchPost();
  }, [id]);

  async function fetchPost() {
    if (!id) return;
    let provider;
    if (NEXT_PUBLIC_ENVIRONMENT === 'local') {
      provider = new ethers.providers.JsonRpcProvider('HTTP://127.0.0.1:8545');
    } else if (NEXT_PUBLIC_ENVIRONMENT === 'testnet') {
      provider = new ethers.providers.JsonRpcProvider(API_URL);
    }

    const contract = new ethers.Contract(contractAddress, Blog.abi, provider);
    const val = await contract.fetchPost(id);
    const postId = val[0].toNumber();

    const ipfsUrl = `https://${id}${ipfsURI}`;
    const response = await fetch(ipfsUrl);
    const data = await response.json();

    if (data.coverImage) {
      let coverImagePath = `https://${data.coverImage}${ipfsURI}`;
      data.coverImagePath = coverImagePath;
    }

    data.id = postId;
    setPost(data);
  }

  async function savePostToIpfs() {
    try {
      const blob = new Blob([JSON.stringify(post)], {
        type: 'application/json',
      });
      const filePost = [new File([blob], 'post')];
      const added = await client.put(filePost, { wrapWithDirectory: false });
      return added;
    } catch (err) {
      console.log('error: ', err);
    }
  }

  async function updatePost() {
    const hash = await savePostToIpfs();
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, Blog.abi, signer);
      try {
        await contract.updatePost(post.id, post.title, hash, true);
        router.push('/');
      } catch (err) {
        console.log('Error: ', err);
      }
    }
  }

  if (!post) return null;

  return (
    <div className={container}>
      {editing ? (
        <div>
          <input
            onChange={(e) => setPost({ ...post, title: e.target.value })}
            name="title"
            placeholder="Give it a title ..."
            value={post.title}
            className={titleInput}
          />
          <SimpleMDE
            className={mdEditor}
            placeholder="What's on your mind?"
            value={post.content}
            onChange={(value) => setPost({ ...post, content: value })}
          />
          <button className={button} onClick={updatePost}>
            Update post
          </button>
        </div>
      ) : (
        <div>
          {post.coverImagePath && (
            <img src={post.coverImagePath} className={coverImageStyle} />
          )}
          <h1>{post.title}</h1>
          <div className={contentContainer}>
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </div>
      )}
      <button className={button} onClick={() => setEditing(!editing)}>
        {editing ? 'View post' : 'Edit post'}
      </button>
    </div>
  );
}

const button = css`
  background-color: #fafafa;
  outline: none;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  margin-right: 10px;
  margin-top: 15px;
  font-size: 18px;
  padding: 16px 70px;
  box-shadow: 7px 7px rgba(0, 0, 0, 0.1);
`;

const titleInput = css`
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

const mdEditor = css`
  margin-top: 40px;
`;

const coverImageStyle = css`
  width: 900px;
`;

const container = css`
  width: 900px;
  margin: 0 auto;
`;

const contentContainer = css`
  margin-top: 60px;
  padding: 0px 40px;
  border-left: 1px solid #e7e7e7;
  border-right: 1px solid #e7e7e7;
  & img {
    max-width: 900px;
  }
`;
