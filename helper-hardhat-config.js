const { ethers } = require("hardhat")

const networkConfig = {
    4: {
        name: "rinkeby",
        vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        subscriptionId: "10325",                                                        // temp. assign Zero
        callbackGasLimit: "500000",                                                     // set high: 500,000 gas units
        interval: "30",                                                                  // 30 seconds
        mintFee: "10000000000000000",           // 0.01 ETH
        ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
    31337: {
        name: "hardhat",
        // vrfCoordinatorV2: NOT needed here because we're deploying mocks on "hardhat" and "localhost"...
        // before the control reaches to the point of deploying BasicNft.sol and RandomIpfsNft.sol
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",  // anything here will work, value does not matter, bcz our mock will anyway mock the gasLane value
        callbackGasLimit: "500000",                                                      // set high: 500,000 gas units, though it hardly matters here again
        interval: "30",                                                                  // 30 seconds, it DOES matter here
        // subscriptionId: NOT needed here because we're deploying mocks on "hardhat" and "localhost"
        mintFee: "10000000000000000",           // 0.01 ETH    
        // ethUsdPriceFeed: "we're gonna use Mock, hence, nothing required here"
    }
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig, 
    developmentChains,
}