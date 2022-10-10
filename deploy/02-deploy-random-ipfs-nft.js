// usual imports - use 'require'
const {network, ethers} = require("hardhat")
const {developmentChains, networkConfig} = require("../helper-hardhat-config.js")
const {verify} = require("../utils/verify")
//  importing {storeImages} here
const {storeImages, storeTokenUriMetadata} = require ("../utils/uploadToPinata")

// spacing allowed in the directory name
// NOT an import, NOT using 'require', it's just assigning a value
const imagesLocation = "./images/RandomIpfsNft"

// Create a Metadata template:
const metadataTemplate = {
    name: "",
    description: "",
    image: "",              // will be populated soon with the IPFS URL
    attributes: [           // ideally, attributes should be stroed on-chain so that contracts can interact with these
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
}

let tokenUris = [
    "ipfs://QmPsddgwx2s4HE5V9so61eSR3NfGgJMkHgpTRBw1jnmTrH",
    "ipfs://QmYzrvrN5pSqx19qXUCvJm4uau1rcpytPJGzzBkJQDdv82",
    "ipfs://QmPU6NzQQFJKWJ6MukigvnU4D2GWTvcTtSqQu1U735UNqV",
]  
// will have the final returned value of the array, from handleTokenUris()
// taken out of module.exports as it's not gonna change now
// REMEMBER = we obtained all tokenUris from handleTokenUris() f() - super powerful f() here

const FUND_AMOUNT = "10000000000000000000"                              // 10 LINK, arbitrary amount for MOCKS

//  START the script now
module.exports = async function ({getNamedAccounts, deployments}) {     // get auto-pulled from hre, hence, all-time available
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId

    // get IPFS hashes of all 3 images:
    if(process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    // a f() that lets us upload our code to Pinata
    // returns only the IpfsHashes[] array of all 3 Metadata_JSON objects, get print at the end
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

        // get subId in this case, create the Subscription
        const txResponse = await vrfCoordinatorV2.createSubscription() 
        const txReceipt = await txResponse.wait(1)
        //console.log(`Transaction Receipt: ${JSON.stringify(txReceipt)}`)    // Is not getting printed ??
        subscriptionId = txReceipt.events[0].args.subId     // 'subId' var comes from event SubscriptionCreated(uint64 indexed subId, address owner) in MOCK
        
        // we have to Fund the Subscription as well
        // fundSubscription: allows funding a subscription with an arbitrary amount for local testing, not Rinkeby
        await vrfCoordinatorV2.fundSubscription(subscriptionId, FUND_AMOUNT)
    } 
    else {
        // vrfCoordinatorV2 used differently here as compared to above if {}
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
        // both of these 2 networkCnfig vars are strings set in helper-config file
    }
    console.log(`vrfCoordinatorV2Address ${vrfCoordinatorV2Address}`)
    console.log(`subscriptionId ${subscriptionId}`)
    
    console.log("------vrfCoordinatorV2Address, subscriptionId populated-------")
 
    // PERMANENT measure: setting Constructor Arguments now...
    const args = [vrfCoordinatorV2Address, networkConfig[chainId].gasLane, networkConfig[chainId].callbackGasLimit, subscriptionId, tokenUris, networkConfig[chainId].mintFee]
    // before tokenUris - go to Pinata and all the heavylifting of pinning Images + NFT's metadata

    // FINALLY, DEPLOY
    console.log("Deploying Random IPFS NFT Smart Contract...")
    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations,
    })

    console.log("--------Random IPFS NFT deployed!!---------")

    // Now, verifying...
    // Verify on Etherscan, if it's Rinkeby
    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying on Etherscan...")
        await verify(randomIpfsNft.address, args)
        //  it takes address and args of the S/C as parameters
        console.log("--------------------------")
    }
}

// outside module.exports
// will return an array of tokenUris
async function handleTokenUris() {
    tokenUris = []
    //  1. store the image on Pinata IPFS node using storeImages(path) - D
    //  which leads us to another script - uploadToPinata.js = storeImages(path)
    //  2. store the metadata on IPFS - done below in the for loop () and calling storeTokenUriMetadata()-D
    // 'imagesFilePath' = imagesLocation is passed into it
    const {responses, files} = await storeImages(imagesLocation)  // will try lo. to print 'responses'
    // responses = list / array of IPFS hashes for all 3 files returned in each of the response
    
        //  2 ops. inside this loop
        //  1. create metadata for each pic - D
        //  2. Add / Upload / Store metadata for each using storeTokenUriMetadata - D
        //  loop thru the responses and upload each of the metadata
        for (responsesIndex in responses) {
            let tokenUriMetadata =  {...metadataTemplate}
            // console.log(`Checking: ...metadataTemplate = TokenURIMetadata: ${tokenUriMetadata}`)
            // unpack / expand and iterate metadataTemplate and assign all the data to tokenUriMetadata, 1 by 1
            tokenUriMetadata.name = files[responsesIndex].replace(".png", "")
            tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup`   // single quotes
            tokenUriMetadata.image = `ipfs://${responses[responsesIndex].IpfsHash}`   // most imp. of all key-value pairs in JSON
            console.log(`Uploading ${tokenUriMetadata.name}...`)
            
            // Now, PART 2: store the JSON object = tokenURI = Metadata on IPFS
            const metadataUploadResponses = await storeTokenUriMetadata(tokenUriMetadata)
            // 'metadataUploadResponses' has all 3 returned values of IpfsHash, PinSize, TimeStamp
            tokenUris.push(`ipfs://${metadataUploadResponses.IpfsHash}`)         
        }
        
        console.log(`Token URIs uploaded!! They are: `)
        console.log(tokenUris)
        return tokenUris
}

module.exports.tags = ["all", "randomipfsnft", "main"]
// no spacing allowed in the tags' naming in hh deploy --tags
// "main" tag iskept here for adding this consumer contract to the VRF subscription