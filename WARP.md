# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

This is a simple NFT DApp composed of a Solidity ERC-721 contract (Hardhat) and a React frontend (Create React App) that interacts with a local Hardhat network via MetaMask.

## Repository structure (high level)

- `contracts/`: Hardhat project containing the `NFT` ERC-721 contract, deployment scripts, and tests.
  - `contracts/contracts/NFT.sol`: main NFT contract (ERC721 + ERC721URIStorage + Ownable).
  - `contracts/scripts/deploy.js`: deploys `NFT` and writes `contracts/deployment.json`.
  - `contracts/scripts/update-frontend.js`: syncs deployment info (address + ABI) into the frontend.
  - `contracts/test/NFT.test.js`: Hardhat/Chai tests for minting and supply/balance behavior.
- `frontend/`: React 18 app (CRA) that connects to MetaMask and calls the `NFT` contract.
  - `frontend/src/App.js`: main UI and web3 wiring (connect wallet, mint NFT, display totals).
  - `frontend/src/contracts/NFT.json`: generated artifact slice (ABI + address + network) used by the frontend.
- Root `package.json`: convenience scripts that proxy into the `contracts` and `frontend` subprojects.

The typical flow is:
1. Run a local Hardhat node in `contracts/`.
2. Deploy the `NFT` contract to the local network.
3. Sync contract address + ABI to the frontend via `update-frontend.js` (usually through `deploy:full`).
4. Start the React dev server in `frontend/` and interact via MetaMask on the `localhost`/Hardhat network.

## Smart contract layer

- Hardhat config: `contracts/hardhat.config.js` defines Solidity 0.8.20, optimizer settings, and two networks:
  - `hardhat` (in-process, `chainId: 1337`).
  - `localhost` (`url: http://127.0.0.1:8545`) used when running a separate node.
- `NFT.sol`:
  - Extends `ERC721URIStorage` and `Ownable`.
  - Maintains a private `_tokenIds` counter.
  - `mintNFT(address to, string tokenURI)` increments `_tokenIds`, mints, sets token URI, and returns the new token ID.
  - `totalSupply()` exposes the current `_tokenIds` as total minted supply.
- Tests (`contracts/test/NFT.test.js`):
  - Use `ethers.getContractFactory("NFT")` and `waitForDeployment()`.
  - Verify name/symbol and that repeated `mintNFT` calls correctly set owner, URI, `totalSupply`, and `balanceOf`.

## Frontend DApp

- The frontend expects MetaMask to inject `window.ethereum` and uses `ethers.BrowserProvider` and `ethers.Contract`.
- `frontend/src/contracts/NFT.json` is the single source of truth for the ABI and deployed address used by the UI.
- `frontend/src/App.js`:
  - Contains a `CONTRACT_ADDRESS` constant that `update-frontend.js` rewrites after deployments.
  - On wallet connect, it:
    - Requests accounts via `eth_requestAccounts`.
    - Constructs a provider, signer, and `ethers.Contract` using the ABI from `NFT.json` and the `CONTRACT_ADDRESS`.
    - Calls `totalSupply()` and `balanceOf(account)` to populate basic stats.
  - `mintNFT` calls `contract.mintNFT(account, tokenURI)` and then reloads NFT data.
  - `userNFTs` is currently a placeholder; the UI only shows aggregate counts, not per-token data.

## Contract–frontend integration

- Deploy script (`contracts/scripts/deploy.js`):
  - Deploys `NFT` using Hardhat and writes `contracts/deployment.json` with:
    - `address` (deployed contract address),
    - `network` (Hardhat network name, typically `localhost`),
    - `deployer` and `timestamp`.
- Frontend sync script (`contracts/scripts/update-frontend.js`):
  - Reads `contracts/deployment.json` to get `address` and `network`.
  - Reads the compiled artifact `contracts/artifacts/contracts/NFT.sol/NFT.json` to extract the ABI.
  - Updates `frontend/src/App.js` by replacing the `CONTRACT_ADDRESS` line.
  - Overwrites `frontend/src/contracts/NFT.json` with `{ abi, address, network }`.

This means the authoritative deployment info flows: Hardhat deployment → `deployment.json` → `update-frontend.js` → `App.js` + `frontend/src/contracts/NFT.json`.

If you only run `deploy:local` (without `deploy:full`), you will need to manually keep `CONTRACT_ADDRESS` and `frontend/src/contracts/NFT.json` in sync.

## Core commands

All commands below are defined in the existing `package.json` files or are direct Hardhat/CRA CLI usage consistent with them.

### Initial setup

From the repository root:

- Install all dependencies (root + contracts + frontend):
  - `npm run install:all`

Or, if you prefer manual installation:

- Root only: `npm install`
- Contracts only: `cd contracts && npm install`
- Frontend only: `cd frontend && npm install`

### Contracts (Hardhat)

Run these from `contracts/` unless otherwise noted.

- Compile contracts:
  - `npm run compile`
  - (Underlying: `hardhat compile` as defined in `contracts/package.json`).
- Run the full test suite:
  - `npm test`
  - (Underlying: `hardhat test`).
- Run a single test file (example):
  - `npx hardhat test test/NFT.test.js`
- Start a persistent local node (Hardhat network on `http://127.0.0.1:8545`, chainId 1337):
  - `npm run node`
- Deploy to the local Hardhat node only (no frontend updates):
  - `npm run deploy:local`
- Deploy and automatically sync frontend config (recommended for local dev):
  - `npm run deploy:full`

From the repository root, there are convenience scripts that proxy into `contracts/`:

- Compile: `npm run compile`
- Test: `npm test`
- Start node: `npm run node`
- Deploy to local: `npm run deploy:local`

### Frontend (React)

Run these from `frontend/`:

- Start the development server (listens on `http://localhost:3000`):
  - `npm start`
- Run frontend tests (Jest via `react-scripts`):
  - `npm test`
- Build a production bundle:
  - `npm run build`

From the repository root, there is a convenience script to start the frontend dev server:

- `npm run frontend`

## Network and wallet expectations

- Local network:
  - Hardhat node at `http://127.0.0.1:8545` with `chainId: 1337`.
  - Started via `npm run node` in `contracts/`.
- MetaMask:
  - Should be configured with a custom network pointing to `http://127.0.0.1:8545`, chain ID `1337`, symbol `ETH`.
  - Typical workflow is documented in `METAMASK_SETUP.md` and referenced in `DEVELOPMENT.md`.

If the frontend cannot connect or transactions fail, first confirm:
- The Hardhat node is running.
- MetaMask is on the `Hardhat Local` (localhost) network.
- The contract was deployed to `localhost` and the latest address/ABI have been propagated via `npm run deploy:full`.