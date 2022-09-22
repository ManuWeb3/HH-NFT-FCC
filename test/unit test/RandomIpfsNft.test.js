// In total, 21 Unit tests written.

const { assert, expect } = require("chai")
const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
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
            // console.log(`vrfCoordinatorV2Address before getting any value: ${vrfCoordinatorV2Address}`) // undefined, for now
            vrfCoordinatorV2Address = vrfCoordinatorV2.address                            // after getting the value       
            
            if(vrfCoordinatorV2Address.toString() != undefined) {
                deployed = true
            }
            assert(deployed)
        })

        // exactly same it("") for callbackGasLimit...leave it
        it("GasLane is set correctly", async function () {
            const gasLane = await randomIpfsNft.getGasLane()
            // console.log(`GasLane value: ${gasLane}`)
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

        it("MintFee is set correctly", async function() {
            const mintFee = await randomIpfsNft.getMintFee()
            assert.equal(mintFee.toString(), networkConfig[chainId].mintFee)
        })

        it("Name and Symbol are set correctly", async function () {
            const name = await randomIpfsNft.name()
            const symbol = await randomIpfsNft.symbol()

            assert.equal(name, "Random IPFS NFT")
            assert.equal(symbol, "RIN")
        })

     })
    
     describe("Testing requestNft()", function() {
        it("Should revert if no payment (mintFee) sent", async function () {
            // call with value: 0 OR skipping value: arg altogether
            await expect(randomIpfsNft.requestNft()).to.be.revertedWith("RandomIpfsNft__NeedMoreETHSent")
        })

        it("Should revert if amount less than mintFee is sent", async function () {
            const mintFee = await randomIpfsNft.getMintFee()
            await expect(randomIpfsNft.requestNft({value: mintFee.sub(ethers.utils.parseEther("0.0001"))})).to.be.revertedWith("RandomIpfsNft__NeedMoreETHSent") 
        })

        it("RRW() should run only when requestNft() is invoked", async function () {
            await expect(vrfCoordinatorV2.fulfillRandomWords(0, randomIpfsNft.address)).to.be.revertedWith("nonexistent request")
        })

        it("Maps requestId to the Requester (Minter)", async function() {
            const mintFee = await randomIpfsNft.getMintFee()
            const txResponse = await randomIpfsNft.requestNft({value: mintFee})
            const txReceipt = await txResponse.wait(1)
            const requestId = txReceipt.events[1].args.requestId
            // console.log(`RequestId: ${requestId}`)
            assert(requestId > 0)
            const minter = await randomIpfsNft.s_requestIdToSender(requestId)
            // console.log(`Minter: ${minter}`)
            // console.log(`Deployer: ${deployer}`)
            assert.equal(minter, deployer)
            // event in next assert, ideally 1 it() should have 1 assert only
            // await expect(randomIpfsNft.requestNft({value: mintFee})).to.emit(randomIpfsNft, "NftRequested").withArgs(requestId.toNumber()+1, deployer)
        })

        // Event emit has already been checked thru retrieval of requestId above...
        // likewise we did in Raffle.sol and we can leave it there...
        // Still, checking event.
        it("Should emit NftRequested event - withArgs: RequestId & deployer", async function () {
            const mintFee = await randomIpfsNft.getMintFee()
            // get the requestId out of emit to check: withArgs(requestId.toNumber()+1, deployer): optional
            const txResponse = await randomIpfsNft.requestNft({value: mintFee})
            const txReceipt = await txResponse.wait(1)
            const requestId = txReceipt.events[1].args.requestId

            await expect(randomIpfsNft.requestNft({value: mintFee})).to.emit(randomIpfsNft, "NftRequested").withArgs(requestId.toNumber()+1, deployer)
        })
     })

     describe ("Testing getChanceArray()", function () {
        it("Should return the array of 3 uint256 Constants", async function() {
            let chanceValues = []
            chanceValues = await randomIpfsNft.getChanceArray()
            const maxValue = await randomIpfsNft.MAX_CHANCE_VALUE()
            assert.equal(chanceValues[0].toString(), "10")
            assert.equal(chanceValues[1].toString(), "40")
            assert.equal(chanceValues[2].toString(), maxValue.toString())
            // Below, does not resolve the Prmoise
            // assert.equal(chanceValues[2].toString(), await randomIpfsNft.MAX_CHANCE_VALUE().toString())
        })
     })

     describe("Testing getBreedFromModdedRng()", function() {
        // Method # 1: checks 3 values upon static input, 1 for each dogBreed

        // it("Should return correct Dog Breed", async function() {
        //     const dogBreed = await randomIpfsNft.getBreedFromModdedRng(99)
        //     assert.equal(dogBreed, "2")
        // })

        // Method # 2: Better to make 3 it()s, 1 for each dogBreed
        // OR put all 3 asserts in the same it() with comments for each dogBreed
        it("Should return 'Pug' for any moddedRng value: 0-9", async function () {
            const dogBreed = await randomIpfsNft.getBreedFromModdedRng(7)
            assert.equal(dogBreed, "0")
        })

        it("Should return 'Shiba_Inu' for any moddedRng value: 10-29", async function () {
            const dogBreed = await randomIpfsNft.getBreedFromModdedRng(29)
            assert.equal(dogBreed, "1")
        })

        it("Should return 'St_Bernard' for any moddedRng value: 30-99", async function () {
            const dogBreed = await randomIpfsNft.getBreedFromModdedRng(88)
            assert.equal(dogBreed, "2")
        })

        // better keeping this assert separate
        it("Should revert with Out-of-bounds moddedRng number, e.g. 100", async function() {
            await expect(randomIpfsNft.getBreedFromModdedRng(100)).to.be.reverted
        })

        // test-checking for all values 0-9 for 'Pug'
        /*
        it("Should check for all the values b/w 0-9 for 'Pug'", async function() {
            for (let i=0; i <= 9; i++) {
            const dogBreed = await randomIpfsNft.getBreedFromModdedRng(i)
            assert.equal(dogBreed, "0")
            }
        })
        */
     })

     // 2 asserts in 1 test, Massive Promise test again bcz we want to imitate the testnet exactly on local dev. n/w
     // Exception. Ideally, 1 assert per it()
     describe("Testing fulfillRandomWords()", function () {
        it("Should increment tokenCounter and then emits event ", async function () {
            // 1. assert
            tokenCounter = await randomIpfsNft.getTokenCounter()        // it is '0' for now
            
            await new Promise (async function (resolve, reject) {
                randomIpfsNft.once("NftMinted", async function() {
                    console.log("Found the emitted event: NftMinted!!")
                    // get all latest values after ffRW2() has run, for asserts.
                    try {
                        // 1. assert
                        const incTokenCounter = await randomIpfsNft.getTokenCounter()
                        assert.equal(tokenCounter.toNumber()+1, incTokenCounter.toString())
                        // .toString() concatenates '0' and '1' to '01', hence mismatch with '1'.
                        
                        resolve()
                    }
                    catch(error) {
                        console.log("Shit man... some error occured")
                        
                        reject(error)
                    }
                })
                
                // below code has to be inside Promise block {} as it is 'await' waiting for the event to be fired and then resolve / reject the Promise
                // keeping inside try-catch so that we get to know the error, in case it fails here
                try{
                const mintFee = await randomIpfsNft.getMintFee()
                // call requestNft() by deployer (minter)... has to be called once here anyway...
                // only then the process kicks off and eventually, ffRW2() will be called
                const txResponse = await randomIpfsNft.requestNft({value: mintFee})
                const txReceipt = await txResponse.wait(1)
                const requestId = txReceipt.events[1].args.requestId
                // outside event but inside the Promise block...
                // manually invoke ffRW1(), we mimic being the CL VRF here to emit the event "NftMinted" eventually
                await vrfCoordinatorV2.fulfillRandomWords(requestId, randomIpfsNft.address) 
                // "NftMinted" event gets emitted when ffRW2() is executed till end
                }
                catch (error) {
                    console.log(error)

                    reject(error)   // reject(error) here also in case it fails but resolve only once.
                }
                })
            })
        })

        describe("Testing withdraw()", function () {

            // code another beforeEach() if requestNft() is repetitively needed for every it() for later withdrawal

            it("Should only be withdrawn by the Owner / Artist", async function () {
                const accounts = await ethers.getSigners()
                const randomIpfsNftNewAccount = await ethers.getContract("RandomIpfsNft", accounts[1])
                // also works fine with accounts[1].address (as we connect the contract instance with the deployer = accounts[0].address)
                await expect(randomIpfsNftNewAccount.withdraw()).to.be.revertedWith("Ownable: caller is not the owner")
                // onlyOwner modifier in Ownable.sol has this revert string
            })

            it("Should send all the balance of the contract to the deployer - Single Minter", async function() {
                const accounts = await ethers.getSigners()
                // Fund the contract
                const mintFee = await randomIpfsNft.getMintFee()
                await randomIpfsNft.requestNft({value: mintFee})
                // get Contract's balance after funding - custom f() getBalance()
                const contractBalanceAfterMinting = await randomIpfsNft.getBalance()
                // console.log(`contractBalanceAfterFunding: ${contractBalanceAfterFunding}`)
                // get deployer's balance after funcding - standard f() getBalance()
                const deployerBalanceAfterMinting = await accounts[0].getBalance()
                // console.log(`deployerBalanceAfterFunding: ${deployerBalanceAfterFunding}`)
                // Withdraw from the contract
                // INVOKED BY THE DEPLOYER, GAS SPENT OUT OF ITS BALANCE = 43,598,932,072,524...copy @ Sep 06.
                const tx  = await randomIpfsNft.withdraw()
                const txReceipt = await tx.wait(1)
                const {gasUsed, effectiveGasPrice} = txReceipt    
                const gasCost = gasUsed.mul(effectiveGasPrice)   
                //console.log(`txReceipt: ${JSON.stringify(txReceipt)}`)
                //console.log(`Transaction Response: ${JSON.stringify(tx)}`)
                
                // contract's bal after waithdraw
                const contractBalanceAfterWithdraw = await randomIpfsNft.getBalance()
                // console.log(`contractBalanceAfterWithdraw: ${contractBalanceAfterWithdraw}`)
                // Deployer bal after withdraw
                const deployerBalanceAfterWithdraw = await accounts[0].getBalance()
                // console.log(`deployerBalanceAfterWithdraw: ${deployerBalanceAfterWithdraw}`)
                // 2 asserts
                assert.equal(contractBalanceAfterWithdraw.toString(), "0")  
                // contract was definitely funded bcz we've already tested requestNft() - works fine
                // console.log(`(Finally, deployerBalanceAfterFunding.add(contractBalanceAfterFunding)): ${(deployerBalanceAfterFunding.add(contractBalanceAfterFunding))}`)
                // console.log(`FInally, deployerBalanceAfterWithdraw: ${deployerBalanceAfterWithdraw}`)
                
                // Method # 1 - hard coded the total gas used
                // assert.equal((deployerBalanceAfterWithdraw.add(43598932072524)).toString(), (deployerBalanceAfterFunding.add(contractBalanceAfterFunding)).toString())

                // Method # 2 - programatically calc. total gas used = gasCost = 43,598,932,072,524
                assert.equal((deployerBalanceAfterWithdraw.add(gasCost)).toString(), (deployerBalanceAfterMinting.add(contractBalanceAfterMinting)).toString())
               
            })

            // it("Should revert upon Transfer_Fail", async function () {
            //     const contractBalance = await randomIpfsNft.getBalance()
            //     console.log(`Balance: ${contractBalance}`)
            //     await expect(randomIpfsNft.withdraw()).to.be.revertedWith("RandomIpfsNft__TransferFailed")
            // })

            it("Should send all the balance of the contract to the deployer - Multiple Minters", async function() {
                const mintFee = await randomIpfsNft.getMintFee()
                const accounts = await ethers.getSigners()
                const contractBalanceBeforeMinting = await randomIpfsNft.getBalance()
                // for loop to .connect() all Minters
                let additionalMinters = 3
                for(let i = 1; i <= additionalMinters; i++) {        // except the artist / owner (deployer) himself
                    const randomIpfsNftMinters = await randomIpfsNft.connect(accounts[i])
                    // 'randomIpfsNft' - orig. abstraction instance only is used to .connect( to all new accounts) and...
                    //  return new connections / copies, each with the name 'randomIpfsNftMinters' of 'randomIpfsNft'
                    await randomIpfsNftMinters.requestNft({value: mintFee})
                }
                const deployerBalanceAfterMinting = await accounts[0].getBalance()      // after minting by other 3 minters
                const contractBalanceAfterMinting = await randomIpfsNft.getBalance()
                // estimating gasCost in .withdraw() for addBack.
                const tx = await randomIpfsNft.withdraw()
                const txReceipt = await tx.wait(1)
                const {gasUsed, effectiveGasPrice} = txReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)
                const deployerBalanceAfterWithdraw = await accounts[0].getBalance()
                const contractBalanceAfterWithdraw = await randomIpfsNft.getBalance()

                // 1. assert to tally contract balance afetr minting
                assert.equal(contractBalanceAfterMinting.toString(), (mintFee.mul(additionalMinters)).toString())   
                // 2. assert to tally deployer-balance after minting and after withdraw
                assert.equal((deployerBalanceAfterMinting.add(mintFee.mul(additionalMinters))).toString(), (deployerBalanceAfterWithdraw.add(gasCost)).toString())
                // 3. (optional) assert to tally start and end balances of the contract = '0'
                assert.equal(contractBalanceBeforeMinting.toString(), contractBalanceAfterWithdraw.toString())
            }) 
        })

        describe("Testing _initializeContract()", function() {
            it("Should revert if Contract (s_dogTokenUris) is re-initialized", async function () {
                let testTokenUris = ["a", "b", "c"]
                await expect(randomIpfsNft._initializeContract(testTokenUris)).to.be.revertedWith("RandomIpfsNft__AlreadyInitialized")
            })

            // to check whether 's_dogTokenURIs' is set to all 3 URI-values
            it("TokenURIs are set correctly", async function() {
                const tokenUri0 = await randomIpfsNft.getDogURIs(0)
                const tokenUri1 = await randomIpfsNft.getDogURIs(1)
                const tokenUri2 = await randomIpfsNft.getDogURIs(2)
                // Method # 1
                assert.equal(tokenUri0.toString().includes("ipfs://"), true)
                // OR assert(tokenUri0.includes("ipfs://"))

                // Method # 2, to check complete value of URI string
                assert.equal(tokenUri0.toString(), "ipfs://QmPsddgwx2s4HE5V9so61eSR3NfGgJMkHgpTRBw1jnmTrH")
                assert.equal(tokenUri1.toString(), "ipfs://QmYzrvrN5pSqx19qXUCvJm4uau1rcpytPJGzzBkJQDdv82")
                assert.equal(tokenUri2.toString(), "ipfs://QmPU6NzQQFJKWJ6MukigvnU4D2GWTvcTtSqQu1U735UNqV")
            })

            it("should set s_initialized to 'true' after deployment", async function () {
                const initValue = await randomIpfsNft.getInitializedBool()
                assert.equal(initValue, true)
            })
        })
    })