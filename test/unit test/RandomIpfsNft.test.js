const { assert, expect } = require("chai")
const { deployments, getNamedAccounts, ethers, network, getChainId } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) ? describe.skip : describe("Random IPFS NFT: Unit Tests", function () {
    let deployer, deployed, tokenCounter, vrfCoordinatorV2, randomIpfsNft, vrfCoordinatorV2Address
    const chainId = network.config.chainId

    beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])

        // after deploying the Mock and RandomIpfsNft, getting their latest deployed-intsances' abstractions
        vrfCoordinatorV2 = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
        
        // Someone has to request_NFT() in order to start the entire process
        // console.log("Requesting NFT...")
        // await randomIpfsNft.requestNft()      
    })

    describe("Testing Constructor", function () {
        it("The address of VRFCoordinatorV2Mock is correct:", async function() {
            console.log(`vrfCoordinatorV2Address before getting any value: ${vrfCoordinatorV2Address}`) // undefined, for now
            vrfCoordinatorV2Address = vrfCoordinatorV2.address                            // after getting the value       
            
            if(vrfCoordinatorV2Address.toString() != undefined) {
                deployed = true
            }
            assert(deployed)
        })

        // exactly same it("") for callbackGasLimit...leave it
        it("GasLane is set correctly", async function () {
            const gasLane = await randomIpfsNft.getGasLane()
            console.log(`GasLane value: ${gasLane}`)
            // if(gasLane.toString() != undefined) {
            //     deployed = true
            // }
            // assert(deployed)

            // second kind of 'assert'
            assert.equal(gasLane.toString(), networkConfig[chainId].gasLane)
            // got chainId from config.js, matched with all the chainId-values against networkConfig in helper.config.js
        })

        it("Subscription id is set correctly", async function () {
            // Method # 1:
            const subscriptionId = await randomIpfsNft.getSubscriptionId()
            //  assert(subscriptionId > 0)
            //  neither undefined nor zero should pass this test

            // Method # 2:
            assert.equal(subscriptionId.toString(), "1")
            // Mock runs only at our local n/w, so value will be 1 bcz initial value is 0, as per Mock contract
        })

        it("TokenURIs are set correctly", async function() {
            const tokenUri0 = await randomIpfsNft.getDogURIs(0)
            const tokenUri1 = await randomIpfsNft.getDogURIs(1)
            const tokenUri2 = await randomIpfsNft.getDogURIs(2)
            assert.equal(tokenUri0.toString(), "ipfs://QmPsddgwx2s4HE5V9so61eSR3NfGgJMkHgpTRBw1jnmTrH")
            assert.equal(tokenUri1.toString(), "ipfs://QmYzrvrN5pSqx19qXUCvJm4uau1rcpytPJGzzBkJQDdv82")
            assert.equal(tokenUri2.toString(), "ipfs://QmPU6NzQQFJKWJ6MukigvnU4D2GWTvcTtSqQu1U735UNqV")
        })

        it("MintFee is set correctly", async function() {
            const mintFee = await randomIpfsNft.getMintFee()
            assert.equal(mintFee.toString(), networkConfig[chainId].mintFee)
        })

        it("Name and Symbol are set correctly", async function () {
            
        })

     })
    
    //  describe("Testing requestNft()", function() {
    //     it("")
    //  })
})
