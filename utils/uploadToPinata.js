// make an account on Pinata
// Pinata is just another IPFS node managed by someone else...
// we're asking that 'someone' else to kindly pin our file
// 3 modes - CID (IPFS hash of the content), direct file or folder upload

// install npm package of @pinata/sdk and NodeJS' path module
// import after installing

const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
require("dotenv").config()
// to use process.env below in this specific script

const pinataApiKey = process.env.PINATA_API_KEY
const pinataApiSecret = process.env.PINATA_API_SECRET
const pinata = pinataSDK(pinataApiKey, pinataApiSecret)
// have to tell Pinatathat it's us whom you're interacing with thru these 2 vars.

async function storeImages (imagesFilePath) {
    const fullImagesPath = path.resolve(imagesFilePath)             // gives full o/p of the path
    const files = fs.readdirSync(fullImagesPath)                    // returns the names of the image-files in the dir.
    console.log(files)                                              // optional
    // console.log(fileIndex) - won't work. JS-For-In loop syntax
    let responses = []
    // to store all 3 pushed responses, 1 by 1 below.
    console.log("Uploading to Pinata...")

    for (fileIndex in files){
        console.log(`Working on fileIndex # ${fileIndex}`)
        // need to create a ReadStream's instance - PER FILE (per pic)
        const readableStreamForFiles = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)
        // Pinata stff will be done inside try {} catch {}
        try {
            // pinata stuff, after creating Pinata_Key and Secret
            const response = await pinata.pinFileToIPFS(readableStreamForFiles)
            // we're talking to Pinata node of IPFS, not just IPFS using these end points
            // pinFileToIPFS() - pins only 1 file at a time, hence the for loop
            // has to input ReadStream's instance, arg.
            // push the returned response to responses array, per file, per iteration
            responses.push(response)
        }
        catch (error) {
            console.log(error)
        }
    }
    return {responses, files}
    // both got populated inside this f()
}

module.exports = {storeImages}

/*----------------------------------------------------------------------------------------------------------------*/
// Details of some of the f() used above

// 1. Path.resolve() Method:
// what's its utility btw ??

/*
path.resolve('/foo/bar', './baz');
// Returns: '/foo/bar/baz'

path.resolve('/foo/bar', '/tmp/file/');
// Returns: '/tmp/file'

path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif');
// If the current working directory is /home/myself/node,
// this returns '/home/myself/node/wwwroot/static_files/gif/image.gif'
*/

/* 2. Node.js fs.readdirSync(path, options) Method
// synchronously read the contents of a given directory...
// The method returns an array with all the file names or objects in the directory.
// 2 Paramters: 
// path: It holds the path of the directory from where the contents have to be read. 
// It can be a String, Buffer or URL.
// Returns: It returns an array of String, Buffer or fs.Dirent objects that contain the files in the directory.
*/

/* 3. fs = fileSystem, 
// part of core NodeJS, so no need to install it separately, just requiring works
// imp. fs() to interact / deal with the File Systems
*/

/* 4. Path 
// // have to install npm pkg of 'Path'
// it's NodeJS' module (lib:path.js)...
// provides utilities for working with file and directory paths, images' paths in our case
*/

/* 5. fs.createReadStream()
Returns: <Instances of <fs.ReadStream> are created and returned using the fs.createReadStream() function.
*/

/*6. Pinning few details:
pinFileToIPFS() - pins 1 single file / directory at a time to Pinata
pinJSONToIPFS() - uses metadata / JSON object for the above operation
pinByHash() - interesting...when you don't have the files locally but on IPFS already...
you can refer to those by IPFS Hash and import in Pinata a/c & get it pinned then
*/

// If any 1 of the 3 files is not pinned, it will only be at your IPFS node and not on Pinata...
// So, whenever my IPFS node goes down, it won't be visible to anyone...
// only the pinned ones wil be visible
// I can use unpin() endpoint