// taken from https://melvingeorge.me/blog/encrypt-decrypt-message-nodejs
//also review https://blog.logrocket.com/node-js-crypto-module-a-tutorial/
//  get crypto module
// import crypto from "crypto"; // secret key

// const iv = crypto.randomBytes(16).toString("hex").slice(0, 16);
// /**
//  * @deprecated hardcodec key
//  * @param msg
//  * @returns
//  */
// export const encrypt: (msg: string) => string = (msg) => {
//   // generate 16 bytes of random data

//   // make the encrypter function
//   const encrypter = crypto.createCipheriv(
//     "aes-256-cbc",
//     "a9ae2ce6-1145-46cf-803b-d493b9251d98",
//     iv
//   );

//   // encrypt the message
//   // set the input encoding
//   // and the output encoding
//   let encryptedMsg = encrypter.update(msg, "utf-8", "hex");

//   // stop the encryption using
//   // the final method and set
//   // output encoding to hex
//   encryptedMsg += encrypter.final("hex");
//   // console.log("Encrypted message: " + encryptedMsg);
//   return encryptedMsg;
// };
// /**
//  * @deprecated hardcoded key
//  * @param msg
//  * @returns
//  */
// export const decrypt: (msg: string) => string = (msg) => {
//   // make the decrypter function
//   const decrypter = crypto.createDecipheriv(
//     "aes-256-cbc",
//     "a9ae2ce6-1145-46cf-803b-d493b9251d98",
//     iv
//   );

//   // decrypt the message
//   // set the input encoding
//   // and the output encoding
//   let decryptedMsg = decrypter.update(msg, "hex", "utf8");
//   // stop the decryption using
//   // the final method and set
//   // output encoding to utf8
//   decryptedMsg += decrypter.final("utf8");

//   // console.log("Decrypted message: " + decryptedMsg);
//   return decryptedMsg;
// };
