// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNft is ERC721 {

    event Minted(address indexed owner, uint256 indexed tokenId);

    uint256 private s_tokenCounter;

    // address public zeroAddress = address(0);

    string public constant TOKEN_URI = "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

    constructor () ERC721 ("Doggie", "DOG") {
        s_tokenCounter = 0;                             //  explicitly initialized to Zero
    }

    function mintNft() public {       //  But, does this actually return anything? Events... 
        s_tokenCounter++;
        _safeMint(msg.sender, s_tokenCounter);          //  it does not throw any error if we make a setter f() to return something
        emit Minted(msg.sender, s_tokenCounter);
        
        //  return s_tokenCounter;                      //  not serving any purpose, can be removed
        // we did NOT call _setTokenURI() from ERC721URIStorage as...
        // as the TokenURI is a constant here and everyone will be linked to the same tokenURI
    }

    function tokenURI(uint256 tokenId) public pure override returns (string memory) {
        //  require(_exists(tokenId))   // commented out bcz we're not passing the tokenId for now...
        return TOKEN_URI;
        //  f() can be made 'pure' bcz reading a constant var is Not reading from storage, as it's a part of the bytecode directly
        //  when we read a state variable from "Storage", then it should be 'view'
        //  this getter is not used in any of the 2 Std. Unit tests, so we're testing it to see that it actually got the desired string
    }

    function getTokenCounter() public view returns(uint256) {
        return s_tokenCounter;
        //  no need to Unit test any getter because all getters return values in the tests that get matched, hence already tested
    }
}