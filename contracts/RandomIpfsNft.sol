//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openZeppelin/contracts/token/ERC721/ERC721.sol";

error RandomIpfsNft__RangeOutOfBounds();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721 {
    //  while minting NFT, we'll call Chainlink VRF to generate a random number...
    //  which will be used to generate random NFT
    //  PUG, Shiba Inu, St. Bernard with diff. rarity

    //  users will have to pay for minting the NFTs
    //  the owner (artist) will withdraw the money

    //  Type Declaration for enums, structs, etc.
    enum Breed {Dog, Shiba_Inu, St_Bernard};                        //  backend uint256 0,1,2...

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

    //  usual functions()
    constructor (address vrfCoordinator, bytes32 gasLane, uint32 callbackGasLimit, uint64 subscriptionId) VRFConsumerBaseV2 (vrfCoordinator) ERC721 ("Random IPFS NFT", "RIN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        i_subscriptionId = subscriptionId;
    }

    function requestNft() public returns (uint256 requestId) {            //  trigger Chainlink VRF's requestRandomWords()...
    //  this time we're doing it manually by users, NOT automating it, NOT using CL Keepers unlike Raffle
    //  declared in the f() signature above (return)
        requestId = i_vrfCoordinator.requestRandomWords(i_gasLane, i_subscriptionId, REQUEST_CONFIRMATIONS, i_callbackGasLimit, NUM_WORDS);
        s_requestIdToSender[requestId] = msg.sender;
    }

    //  requestId is needed in NFT.sol bcz many users will be manually minting the NFTs. hence, mappings needed
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {    //  when randomWords' array is returned by VRFCood (when it expands 1 random word into many, as requested by consumer contracts)
    //  auto-called internally, Not externally
    //  can't call _safeMint(msg.sender, ... ) here bcz that will make CL VRF node the NFT owner...
    //  bcz CL node is msg.sender that invokes ffRW2() internally

    //  hence, MAPPING
    address dogOwner = s_requestIdToSender[requestId];
    uint256 newTokenId = s_tokenCounter;
    // now call safeMint()
    _safeMint(dogOwner, newTokenId);
    //  modded values
    //  only 1 Random word / number requested, so array index = 0 only
    uint256 moddedRng = randomWords[0] % 100;
    //  returns 0-99
    //  0-10: Dog
    //  11-30: Shiba Inu
    //  31-100: St. Bernard



    //  getBreedFromModdedRng(moddedRng) 
    }

    function getBreedFromModdedRng(uint256 moddedRng) public view returns (Breed) {
        uint256 cumulativeSum = 0;
        //  access ChanceArray
        uint256[3] memory chanceArray = getChanceArray();
        
        for (uint256 i=0; i < chanceArray.length; i++) {
            if(moddedRng >= cumulativeSum && moddedRng < cumulativeSum + chanceArray[i]) {
                return Breed[i];
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

    function tokenURI (uint256) public view override returns (string memory){}       //  what this NFT looks like - looks will be linked here / metadata carrying URL
    //  why empty body ??

}