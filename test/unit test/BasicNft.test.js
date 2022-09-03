const { assert, expect } = require("chai")
const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) ? describe.skip : describe("BasicNft Unit Tests", function () {
    let basicNft, deployer, tokenCounter                            // better to keet it global scope

    beforeEach(async function () {
        console.log("BasicNft.sol deploying...")
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])

        basicNft = await ethers.getContract("BasicNft", deployer)
        console.log("BasicNft.sol deployed!!")
    })

    describe ("Testing Constructor", function () {
        //  constructor already gets called upon deployment
        it ("Should assign correct values to 'Name', 'Symbol', and 'TokenId'", async function () {
            //  even reading / getters need 'await'
            const name = await basicNft.name()
            const symbol = await basicNft.symbol()
            tokenCounter = await basicNft.getTokenCounter()

            assert.equal(name, "Doggie")
            assert.equal(symbol, "DOG")
            assert.equal(tokenCounter.toString(), "0")
        })
    })

    describe("Testing MintNft()", function() {
        //  have to call the functions individually
        it("Updated 2 mappings: _balances[] and _owners[] & incremented tokenCounter", async function() {
            
            const txResponse = await basicNft.mintNft()                 //  mintNft() itself takes no args
            //  tokenCounter = await basicNft.getTokenCounter()         //  tokenCounter got incremented already, hence no owner, hence throws
            
            // wait(1) only doine to print txeceipt as it wasn't getting printed. It is not needed here, ideally.
            // const txReceipt = await txResponse.wait(1)
            // console.log(`Transaction Receipt: ${JSON.stringify(txReceipt)}`)
            
            tokenCounter = await basicNft.getTokenCounter()             // after minting, counter = 1
            console.log(`Token Counter after minting: ${tokenCounter}`)

            const tokenBalance = await basicNft.balanceOf(deployer)     
            const tokenOwner = await basicNft.ownerOf(tokenCounter)     
            //  checking 2 private mappings
            assert.equal(tokenBalance.toString(), "1")
            assert.equal(tokenOwner.toString(), deployer)  
            //  checking whether tokenCounter incremented by 1
            // tokenCounter = await basicNft.getTokenCounter()
            assert.equal(tokenCounter.toString(), "1")
        })

        it("Should emit Minted event", async function() {
            //  have to call the functions individually, SPECIALLY for event-emit check
            tokenCounter = await basicNft.getTokenCounter()
            // const zeroAddress = await basicNft.zeroAddress()
            // console.log(`zeroAddress: ${zeroAddress}`)
            console.log(`Deployer: ${deployer}`)
            console.log(`Token Counter before MintNft(): ${tokenCounter}`)
            console.log(`Token Counter should be: ${tokenCounter+1} after mintNft()`)
            await expect(basicNft.mintNft()).to.emit(basicNft, "Minted").withArgs(deployer, tokenCounter+1)
        })
    })

    describe("Testing tokenURI", function() {
        it("tokenURI should be set correctly", async function (){
            const tokenURI = await basicNft.tokenURI(2)             //  works for all uint256 values: 0,1,2... as it's just symbolic arg
            assert.equal(tokenURI, await basicNft.TOKEN_URI())      //  no need to run mintNft() to test this
            //  comparing the set-constant value with the returned value of f() as it was never used during our Unit tests
            //  no need to keep it nested
        })
    })
    
})
