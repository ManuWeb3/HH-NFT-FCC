const {network, ethers} = require("hardhat")
const {developmentChains, networkConfig} = require("../helper-hardhat-config.js")
const {verify} = require("../utils/verify")

//  start the script now
module.exports = async function ({getNamedAccounts, deployments}) {     // get auto-pulled from hre, hence, all-time available
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId

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

    // setting COnstructor Arguments now
    const args = [vrfCoordinatorV2Address, networkConfig[chainId].gasLane, networkConfig[chainId].callbackgasLimit, subscriptionId, /*dogTokenUris*/, networkConfig[chainId].mintFee]
    // before dogTokenUris - go to Pinata

}