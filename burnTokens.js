const web3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
require('dotenv').config()

const lepeAddress = new web3.PublicKey('9B31sgN9D1j1n53rkWF523Nkp4oBaktonUX7rUuyDRaP');

async function burnToken(tokenMintAddress, burnAmount) {
    // Solana cluster connection
    const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'));

    const secretKey = Uint8Array.from(process.env.SECRET_KEY.split(',').map(Number));
    const wallet = web3.Keypair.fromSecretKey(secretKey);

    // Find token account of the wallet
    const tokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        tokenMintAddress,
        wallet.publicKey
    );

    // Burn
    await splToken.burn(
        connection,
        wallet,
        tokenAccount.address,
        tokenMintAddress,
        wallet.publicKey,
        burnAmount
    );

    console.log(`Burned ${burnAmount} tokens from ${tokenAccount.address.toBase58()}`);
}

burnToken(lepeAddress, 1).catch(err => {
    console.error(err);
});

