const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") // 0.25 ETH is the "Premium". Patrick said 0.25 LINK - I doubt???
//log(`BASE_FEE value set: ${BASE_FEE}`)
const GAS_PRICE_LINK = 1e9 //1 * 10 ** 9 = 1000000000 = 1Gwei. Details mentioned on notebook @ Aug 03.

module.exports = async function ({getNamedAccounts, deployments}) {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId          // need to import "network" from hardhat (auto-import may happen)
    const args = [BASE_FEE, GAS_PRICE_LINK]         // both args inside module.exports, then assigned to args below.


if (developmentChains.includes(network.name)){
    log("Local / Development network detected, deploying mocks...")
    // deploy mock VRF Coordinator for this
    await deploy("VRFCoordinatorV2Mock", {
        from: deployer,
        log: true,
        args: args,
    })
    log("----------------Mock deployed!------------")
}
    
}

module.exports.tags = ["all", "mocks"]
