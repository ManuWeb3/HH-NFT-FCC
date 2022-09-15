// Mint script to mint all 3 of our NFTs

const {network, ethers} = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

let tokenId

//  start the script now
module.exports = async function ({getNamedAccounts}) {     // get auto-pulled from hre, hence, all-time available
    // do NOT need deploy (deployments) here, only need deployer to mint the NFTs
    const {deployer} = await getNamedAccounts()

    // 1. BasicNft
    const basicNft = await ethers.getContract("BasicNft", deployer)
    // by now, all S/c have been deployed by scripts.
    const basicNftMintTx = await basicNft.mintNft()
    await basicNftMintTx.wait(1)

    tokenId = await basicNft.getTokenCounter()        // tokenCounter++ before calling _safeMint()
    console.log(`BasicNft with tokenId: ${tokenId} has tokenURI: ${await basicNft.tokenURI(tokenId)}`)
    // same tokenURI irrespective of the tokenId in our BasicNft.sol (overridden tokenURI())

    // 2. RandomIpfsNft.sol
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await randomIpfsNft.getMintFee()

    await new Promise(async (resolve, reject) => {
        // std. f()
        setTimeout(resolve, 300000)                         // 5 mints. Earlier, in config file
        // Event Listener
        randomIpfsNft.once("NftMinted", async function() {
            // no asserts as this is not a Unit test, direct resolve() at the end
            resolve()
            console.log("Promise successfully resolved!!")
            // can add try{}, catch{}, and reject(error)
        })
    
    // Need to set up a Listener above to listen to the FINAL event emitted in ffRW2(): "NftMinted"
    const randomIpfsNftMintTx = await randomIpfsNft.requestNft({value: mintFee})
    const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1)
    // irrespective of the network, we want to .wait(1)

    // for local dev n/w, we'd run ffRW1() with requestId
    if(developmentChains.includes(network.name)) {
        const requestId = randomIpfsNftMintTxReceipt.events[1].args.requestId
        // events[1] = "NftRequested" (not "NftMinted")
        // we did not take event[0] that's inside rRW() with 5-6 output values...
        // likewise Raffle.sol
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
    }
})  // all this comes inside Promise, outside the Listener

tokenId = await randomIpfsNft.getTokenCounter()             // tokenId inc. by now (inside ffRW2())
console.log(`TokenId value post-mint(): ${tokenId}`)
console.log(`Random Ipfs Nft with tokenID: ${tokenId} has tokenURI: ${await randomIpfsNft.tokenURI(tokenId)}`)
// same tokenURI irrespective of the tokenId in our BasicNft.sol (overridden tokenURI())

    // 3. Dynamic SVG On-chain NFT
    const highValue = ethers.utils.parseEther("4000")       // $4,000 ? OR 4,000 ETH...??
    console.log(`High Value input: ${highValue}`)

    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
    const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(highValue.toString())
    await dynamicSvgNftMintTx.wait(1)

    // const returnedPrice = await dynamicSvgNft.s_returnedPrice()
    // console.log(`Returned Price: ${returnedPrice}`)

    tokenId = await dynamicSvgNft.getTokenCounter()
    console.log(`Dynamic SVG NFT with TokenId: ${tokenId} has tokenURI: ${await dynamicSvgNft.tokenURI(tokenId)}`)
}

module.exports.tags = ["all", "mint"]