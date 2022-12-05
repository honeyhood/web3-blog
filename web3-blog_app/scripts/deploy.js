const hre = require('hardhat');
const fs = require('fs');

async function main() {
  const Blog = await hre.ethers.getContractFactory('Blog');
  const blog = await Blog.deploy('My Web3 blog');

  await blog.deployed();
  console.log('Blog deployed to:', blog.address);

  fs.writeFileSync(
    './config.js',
    `
  export const contractAddress = "${blog.address}"
  export const ownerAddress = "${blog.signer.address}"
  `
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
