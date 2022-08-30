const {network, ethers} = require("hardhat")
const {developmentChains, networkConfig} = require("../helper-hardhat-config.js")
const {verify} = require("../utils/verify")
//  importing {storeImages} here
const {storeImages} = require ("../utils/uploadToPinata")

// spacing allowed in the directory name
const imagesLocation = "./images/Random Ipfs Nft"

//  start the script now
module.exports = async function ({getNamedAccounts, deployments}) {     // get auto-pulled from hre, hence, all-time available
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId

    let tokenUris
    // get IPFS hashes of all 3 images:
    if(process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    // a f() that lets us upload our code to Pinata and handle the tokenUris
    }


    // 3 ways to get  my images pinned:
    // 1. Run IPFS node by myself: ipfs-docs will help == last best
    // 2. Use Pinata - some other node will also pin my images, just in case my node goes down == 2nd best
    // 3. Use Nft.storage - let the entire decentralized n/w pin my image - using filecoin == best
    // for (3), script is there in Patrick's repo
    
    let vrfCoordinatorV2Address, subscriptionId                         //  2 vars whose values we set below

    // Why CL Mocks needed...bcz we're using VRF and local dev. chain
    if(developmentChains.includes(network.name)) {
        // get address of VRFCoodV2(Mock), mock in this case - dev. chain
        const vrfCoordinatorV2 = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        vrfCoordinatorV2Address = vrfCoordinatorV2.address
        // get subId in this case
        const txResponse = await vrfCoordinatorV2.createSubscription() 
        const txReceipt = await txResponse.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
    } 
    else {
        // vrfCoordinatorV2 used differently here as compared to above if {}
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
        // both of these 2 networkCnfig vars are strings set in helper-config file
    }

    console.log("-----------------------------------")
    
    // calling storeImages to see whether our image-names are getting read correctly
    await storeImages(imagesLocation)       // 'imagesFilePath' = imagesLocation is passed into it
    
    // setting Constructor Arguments now...
    // const args = [vrfCoordinatorV2Address, networkConfig[chainId].gasLane, networkConfig[chainId].callbackgasLimit, subscriptionId, /*dogTokenUris*/, networkConfig[chainId].mintFee]
    // before dogTokenUris - go to Pinata, descritpion above

}

// outside module.exports
// will return an array of tokenUris
async function handleTokenUris() {
    tokenUris = []
    //  1. store the image on IPFS
    //  2. store the metadata on IPFS
    //  which leads us to another script - uploadToPinata.js = storeImages(path)

    return tokenUris
}

module.exports.tags = ["all", "randomipfsnft", "main"]
// no spacing allowed in the tags' naming in hh deploy --tags