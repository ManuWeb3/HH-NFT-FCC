// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";
import "hardhat/console.sol";
// no need for _setTokenURI(id)...so, no need to import ERC721URIStorage.sol here
// node_modules is never prepended in the path of any file being imported here

error DynamicSvgNft__NonexistentTokenId();

contract DynamicSvgNft is ERC721 {
    // mint
    // store SVG info somewhere
    // Logic for switching b/w X-image to Y-image
    
    // int256 public s_returnedPrice;
    uint256 private s_tokenCounter;
    // both the i_Uris below will have the Base64.encoded string as hardcoded,...
    // NOT their respective SVG texts
    string private s_lowSvgUri;
    string private s_highSvgUri;
    // both these 2 state variables have now Base64.encoded values saved in them ON-CHAIN
    // that's how you bring metadata (and SVG images) ON-CHAIN
    string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";
    AggregatorV3Interface internal immutable i_priceFeed;
    mapping(uint256 => int256) public s_tokenIdToHighValue;
    // bcz 'price' returned by CL node is int256, so will be the type of 'highValue'

    // event tokenURICreated(string indexed tokenURI);
    event CreatedNFT(uint256 indexed tokenId, int256 highValue);
    // tokenID viz-a-viz threshold set

    // lowSvg and highSvg are the images that'll be input here, hence immutable
    // priceFeedAddress: set in the 'deploy' script
    // For lowSvg, highSvg: import in a new folder and read those in 'deploy' script
    constructor(address priceFeedAddress, string memory lowSvg, string memory highSvg) ERC721 ("Dynamic SVG NFT", "DSN") {
        s_tokenCounter = 0;
        s_lowSvgUri = svgToImageUri(lowSvg);
        s_highSvgUri = svgToImageUri(highSvg);
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // No mintFee, on purpose, hence not payable
    // give minter the choice to set their threshold of High Value for highSvgUri
    function mintNft(int256 highValue) public {
        s_tokenCounter++;
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenIdToHighValue[s_tokenCounter] = highValue;
        emit CreatedNFT(s_tokenCounter, highValue);
        // threshold value assigned to minter's token
    }

    function svgToImageUri(string memory svg) public pure returns (string memory) {
        // will check the o/p of abi.encodePacked(svg) and post ALL these conversions ??... 
        // why many bytes->string->bytes->string???
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded));
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    // overridding public tokenURI() of ERC721.sol
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // using internal "_exists() function" of ERC721.sol
        if(!_exists(tokenId)) {
            revert DynamicSvgNft__NonexistentTokenId();
        }

        ( ,int256 price, , , ) = i_priceFeed.latestRoundData();         // default return type is int256, NOT uint256
        // s_returnedPrice = price;
        string memory imageURI = s_lowSvgUri;
        // minter's set threshold compared below
        
        if(price >= s_tokenIdToHighValue[tokenId]) {
            imageURI = s_highSvgUri;
        }

        // hardcode: JSON format metadata - returns metadataURI
        // using abi.encode only for concat, NOT using it's true 'powers'
        // all concats will take place inside '....' - single quote and put ',' comma after one string is over, before starting next string
        
        // check the output whether 'bytes' conversion is required here, likewise above???
        
        // prepend: data:application/json;base64,BASE64THING
        // string(encodePacked) works but decode(encodePacked)=>string DOESN'T
        
        return 
        string(abi.encodePacked(_baseURI(),                 // 2 brackets
            Base64.encode(bytes(abi.encode('{"name":"',     // 3 brackets
            name(),
            '","description": "An NFT that changes its image based on the Chainlnk Price Feed"',
            '"image":"',
            imageURI,       // low or highSvgUri
            '"attributes":[{"trait_type":"Cuteness", "value":"100"}]}'
        )
        )
        )
        )
        );
        
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

}

//// EXPLANATIONS:

/*
// comes Base64 encoding, so that S/C can handle on-chain SVG data
    // not using Ipfs:// as that's off-chain
    // i/p: 'svg' from constructor - svg here is just a string: <svg>....</svg>
    // o/p: 'base64Encoded-imageUri'
    ---- function svgToImageUri(string memory svg) public pure returns (string memory) { ----
        // encode (bytes memory) return (string memory)
        // svg = <svg>.............</svg>
        // will check the o/p of abi.encodePacked(svg) and post ALL these conversions ?? why many bytes->string->bytes->string???
        ---- string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg)))); ----
        // packed: 10k feet view: concatenate strings, MORE IMP. - shorten
        // abi.encodePacked: globally available methods, returns bytes, we typecast it to string
        // cast to bytes equivalent -> concatenate 2 strings that to in packed form -> we casted to string
        ---- return string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded)); ----
        // just concatenating the 2 input strings, NOT to actually use true powers of abi.encodePacked()
        // even the Packed ones are typecasted perfectly to the original strings and returned
    }
*/