// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// no need for _setTokenURI(id)...so, no need to import ERC721URIStorage.sol here

contract DynamicSvgNft is ERC721 {
    // mint
    // store SVG info somewhere
    // Logic for switching b/w X-image to Y-image

    uint256 private s_tokenCounter;
    string private immutable i_lowSvgUri;
    string private immutable i_highSvgUri;
    string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";

    // lowSvg and highSvg are the images that'll be input here, hence immutable
    constructor(string memory lowSvg, string memory highSvg) ERC721 ("Dynamic SVG NFT", "DSN") {
        s_tokenCounter = 0;
    }

    // No mintFee, on purpose, hence not payable
    function mintNft() public {
        s_tokenCounter++;
        _safeMint(msg.sender, s_tokenCounter);
    }

    // comes Base64 encoding, so that S/C can handle on-chain SVG data
    // not using Ipfs:// as that's off-chain
    // i/p: 'svg' from constructor
    // o/p: 'base64Encoded-imageUri'
    function svgToImageUri(string memory svg) public pure returns (string memory) {

    // packed: 10k feet view: concatenate strings
    // abi.encodePacked: globally available methods, returns bytes, we typecast it to string
    // concatenate 2 strings -> cast to bytes equivalent, that to in packed form -> cast to string
        return string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded));
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

}