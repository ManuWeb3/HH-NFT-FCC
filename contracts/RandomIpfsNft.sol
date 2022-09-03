//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NeedMoreETHSent();
error RandomIpfsNft__TransferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    //  still ERC721's construcotr will remain as is in our code
    //  bcz URIStorage is an extension of ERC721.sol itself

    //  while minting NFT, we'll call Chainlink VRF to generate a random number...
    //  which will be used to generate random NFT
    //  PUG, Shiba Inu, St. Bernard with diff. rarity

    //  users will have to pay for minting the NFTs
    //  the owner (artist) will withdraw the money

    //  for setting URIs to the respective images of selected Dog Breeds
    string[] internal s_dogTokenURIs;
    //  Type Declaration for enums, structs, etc.
    enum Breed {Dog, Shiba_Inu, St_Bernard}                        //  no semi-colon, backend uint256 0,1,2...
    //  mintFee for users to pay and owner to withdraw
    uint256 internal immutable i_mintFee;
    //  ReqId to Owner - mapping
    mapping(uint256 => address) public s_requestIdToSender;         //  ideally, this should be private with a getter() - lo.
    //  lots of vars below set up - needed for Chianlink VRF here
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    //  5 parametrs of requestRandomWords() apart form the address above
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    //  NFT variables
    uint256 public s_tokenCounter;
    uint256 public constant MAX_CHANCE_VALUE = 100;

    //  Events:
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Breed dogBreed, address minter);
    
    //  usual functions()
    constructor (address vrfCoordinator, bytes32 gasLane, uint32 callbackGasLimit, uint64 subscriptionId, string[3] memory dogTokenUris, uint256 mintFee) VRFConsumerBaseV2 (vrfCoordinator) ERC721 ("Random IPFS NFT", "RIN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        i_subscriptionId = subscriptionId;
        s_dogTokenURIs = dogTokenUris;
        i_mintFee = mintFee;
    }

    //  need payment here alongwith
    function requestNft() public payable returns (uint256 requestId) {            //  trigger Chainlink VRF's requestRandomWords()...
    //  this time we're doing it manually by users, NOT automating it, NOT using CL Keepers unlike Raffle
    //  declared in the f() signature above (return)

        if(msg.value < i_mintFee) {
            revert RandomIpfsNft__NeedMoreETHSent();
        }
        requestId = i_vrfCoordinator.requestRandomWords(i_gasLane, i_subscriptionId, REQUEST_CONFIRMATIONS, i_callbackGasLimit, NUM_WORDS);
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    //  requestId is needed in NFT.sol bcz many users will be manually minting the NFTs. hence, mappings needed
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {    //  when randomWords' array is returned by VRFCood (when it expands 1 random word into many, as requested by consumer contracts)
    //  auto-called internally, Not externally
    //  can't call _safeMint(msg.sender, ... ) here bcz that will make CL VRF node the NFT owner...
    //  bcz CL node is msg.sender that invokes ffRW2() internally

    //  hence, MAPPING
    address dogOwner = s_requestIdToSender[requestId];
    uint256 newTokenId = s_tokenCounter;
    // increment the tokenCounter for the next, whenever it happens
    s_tokenCounter++;
    //  modded values
    //  only 1 Random word / number requested, so array index = 0 only
    uint256 moddedRng = randomWords[0] % 100;
    //  returns 0-99
    //  0-10: Dog
    //  11-30: Shiba Inu
    //  31-100: St. Bernard

    //  select the Dog Breed
    Breed dogBreed = getBreedFromModdedRng(moddedRng);
    //  now call safeMint()
    _safeMint(dogOwner, newTokenId);

    //  Part 4 - Set NFT image:
    //  3 methods to connect the randomly selected Dog Breed and its tokenURI, for the image
    //  1. create a mapping b/w the 2
    //  2. invoke the _setTokenURI() in ERC721.sol - but discontinued there now. 
    //  3. Use this same f() defined ion ERC721URIStorage.sol
    _setTokenURI(newTokenId, s_dogTokenURIs[uint256(dogBreed)]);
    // we have 3 constant TokenURIs here but still have to link every minted NFT token to one of those 3... 
    // that's why have to use _setTokenUri() here, depending upon which of the 3 pictures, RANDOMLY,... 
    // the dogOnwer got lnked to in this minting.
    // Not needed in BasicNFT.sol as onl 1 constant tokenURI was there 
    emit NftMinted(dogBreed, dogOwner);
    }

    // Last part: Withdrawal by artist / owner who created those 'varying-rarity' images that users want to (mint and ) own
    // onlyOwner from Ownable.sol
    // no need for us to create custom modifier when OZ alread has it audited and secured thru various internal f() calls.
    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        // this does not do any exception handling / throwing upon failing, just returns bool
        if(!success) {
            revert RandomIpfsNft__TransferFailed();
        }
        
    }

    function getBreedFromModdedRng(uint256 moddedRng) public view returns (Breed) {
        uint256 cumulativeSum = 0;
        //  access ChanceArray
        uint256[3] memory chanceArray = getChanceArray();
        
        for (uint256 i=0; i < chanceArray.length; i++) {
            if(moddedRng >= cumulativeSum && moddedRng < cumulativeSum + chanceArray[i]) {
                return Breed(i);
            }
            cumulativeSum += chanceArray[i];            
        }
        //  if Rng out of bounds, then revert
        revert RandomIpfsNft__RangeOutOfBounds();
    }

    //  Part 3: Create Rarity of 3 dogs
    //  internal so that called internally only
    //  view as returning only constant array + memory declaration
    function getChanceArray() internal view returns(uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    //  10% chance - Dog
    //  20% - Shiba inu
    //  70% - St. Bernard   (not 60%)
    }

    //  this f() not needed anymore bcz we're using _setTokenURI() of ERC721URIStorage.sol to map tokenIds and tokenURIs
    /*  function tokenURI (uint256) public view override returns (string memory){}       //  what this NFT looks like - looks will be linked here / metadata carrying URL
    //  why empty body ?? */

    // Usual GETTERS
    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getDogURIs (uint256 index) public view returns(string memory) {
        return s_dogTokenURIs[index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    /*function getZeroAddress() public pure returns (address) {
        return address(0);
    }*/

    function getGasLane() public view returns (bytes32) {
        return i_gasLane;
    }

    function getSubscriptionId() public view returns (uint256) {
        return i_subscriptionId;
    }

}