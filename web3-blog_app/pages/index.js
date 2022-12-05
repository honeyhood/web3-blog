import { css } from '@emotion/css';
import { useContext } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import Link from 'next/link';
import { AccountContext } from '../context';
import { contractAddress, ownerAddress } from '../config';
import Blog from '../artifacts/contracts/Blog.sol/Blog.json';
import Image from 'next/image';

export default function Home(props) {
  const { posts } = props;
  const account = useContext(AccountContext);

  const router = useRouter();
  async function navigate() {
    router.push('/create-post');
  }

  return (
    <div>
      <div className={postList}>
        {posts.map((post, index) => (
          <Link href={`/post/${post[2]}`} key={index}>
            <div className={linkStyle}>
              <p className={postTitle}>{post[1]}</p>
              <div className={arrowContainer}>
                <Image
                  src="/right-arrow.svg"
                  alt="Right arrow"
                  width={25}
                  height={25}
                  className={smallArrow}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className={container}>
        {account === ownerAddress && posts && !posts.length && (
          <button className={buttonStyle} onClick={navigate}>
            Create your first post
            <Image
              src="/right-arrow.svg"
              alt="Right arrow"
              className={arrow}
              width={35}
              height={35}
            />
          </button>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  let provider;
  if (process.env.ENVIRONMENT === 'local') {
    provider = new ethers.providers.JsonRpcProvider('HTTP://127.0.0.1:8545');
  } else if (process.env.ENVIRONMENT === 'testnet') {
    provider = new ethers.providers.JsonRpcProvider(
      'https://rpc-mumbai.matic.today'
    );
  } else {
    provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com/');
  }

  const contract = new ethers.Contract(contractAddress, Blog.abi, provider);
  const data = await contract.fetchPosts();
  console.log(JSON.stringify(data));
  return {
    props: {
      posts: JSON.parse(JSON.stringify(data)),
    },
  };
}

const arrowContainer = css`
  display: flex;
  flex: 1;
  justify-content: flex-end;
  padding-right: 20px;
`;

const postTitle = css`
  font-size: 30px;
  font-weight: bold;
  cursor: pointer;
  margin: 0;
  padding: 20px;
`;

const linkStyle = css`
  border: 1px solid #ddd;
  margin-top: 20px;
  border-radius: 8px;
  display: flex;
`;

const postList = css`
  width: 700px;
  margin: 0 auto;
  padding-top: 50px;
`;

const container = css`
  display: flex;
  justify-content: center;
`;

const buttonStyle = css`
  margin-top: 100px;
  background-color: #fafafa;
  outline: none;
  border: none;
  font-size: 44px;
  padding: 20px 70px;
  border-radius: 15px;
  cursor: pointer;
  box-shadow: 7px 7px rgba(0, 0, 0, 0.1);
`;

const arrow = css`
  width: 35px;
  margin-left: 30px;
`;

const smallArrow = css`
  width: 25px;
`;
