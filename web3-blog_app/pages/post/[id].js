import ReactMarkdown from 'react-markdown';
import { useContext } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { css } from '@emotion/css';
import { ethers } from 'ethers';
import { AccountContext } from '../../context';

import { contractAddress, ownerAddress } from '../../config';
import Blog from '../../artifacts/contracts/Blog.sol/Blog.json';

const ipfsURI = '.ipfs.w3s.link';

const { ENVIRONMENT, API_URL } = process.env;

export default function Post({ post }) {
  const account = useContext(AccountContext);
  const router = useRouter();
  const { id } = router.query;

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {post && (
        <div className={container}>
          {ownerAddress === account && (
            <div className={editPost}>
              <Link href={`/edit-post/${id}`}>Edit post</Link>
            </div>
          )}
          {post.coverImage && (
            <img src={post.coverImage} className={coverImageStyle} />
          )}
          <h1>{post.title}</h1>
          <div className={contentContainer}>
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export async function getStaticPaths() {
  let provider;
  if (ENVIRONMENT === 'local') {
    provider = new ethers.providers.JsonRpcProvider('HTTP://127.0.0.1:8545');
  } else if (ENVIRONMENT === 'testnet') {
    provider = new ethers.providers.JsonRpcProvider(API_URL);
  }

  const contract = new ethers.Contract(contractAddress, Blog.abi, provider);
  const data = await contract.fetchPosts();

  const paths = data.map((d) => ({ params: { id: d[2] } }));
  return {
    paths,
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  const { id } = params;
  const ipfsUrl = `https://${id}${ipfsURI}`;
  const response = await fetch(ipfsUrl);
  const data = await response.json();
  if (data.coverImage) {
    let coverImage = `https://${data.coverImage}${ipfsURI}`;
    data.coverImage = coverImage;
  }

  return {
    props: {
      post: data,
    },
  };
}

const editPost = css`
  margin: 20px 0px;
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
