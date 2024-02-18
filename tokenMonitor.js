const { Connection, PublicKey } = require("@solana/web3.js");
const { getAccount, TOKEN_PROGRAM_ID } = require("@solana/spl-token");

class TokenMonitor {
    constructor(httpEndpoint, wsEndpoint, tokenAddress, originalSupplyAmount) {
        this.connection = new Connection(httpEndpoint, { wsEndpoint });
        this.tokenPublicKey = new PublicKey(tokenAddress);
        this.originalSupplyAmount = originalSupplyAmount;
        this.currentSupply = null;
        this.totalBurned = null;
    }

    async initializeCurrentSupply() {
        try {
            const tokenSupply = await this.fetchTokenSupply();
            this.totalBurned = await this.fetchTotalBurned();
            this.currentSupply = { amount: tokenSupply.amount, uiAmount: tokenSupply.uiAmount };
        } catch (error) {
            console.error('Error initializing current supply:', error);
            throw error;
        }
    }

    async fetchTokenSupply() {
        try {
            const tokenSupply = await this.connection.getTokenSupply(this.tokenPublicKey, "confirmed");
            return { amount: tokenSupply.value.amount, uiAmount: tokenSupply.value.uiAmount };
        } catch (error) {
            console.error('Error fetching token supply:', error);
            throw error;
        }
    }

    async checkTokenAccountChanged() {
        try {
            const newSupply = await this.fetchTokenSupply();
            const newSupplyAmount = BigInt(newSupply.amount);
            const oldSupplyAmount = BigInt(this.currentSupply.amount);
            const newSupplyUiAmount = newSupply.uiAmount;
            const oldSupplyUiAmount = this.currentSupply.uiAmount;

            if (newSupplyAmount < oldSupplyAmount) {
                console.log("new supply amount: ", newSupplyAmount.toString());
                console.log("old supply amount: ", oldSupplyAmount.toString());

                let amountBurned = oldSupplyAmount - newSupplyAmount;
                let uiAmountBurned = newSupplyUiAmount - oldSupplyUiAmount;

                console.log(`Burn event occurred! ${amountBurned.toString()} burned!`);
                this.currentSupply = { amount: newSupply.amount, uiAmount: newSupply.uiAmount };
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async fetchTotalBurned() {
        try {
            const tokenSupply = await this.fetchTokenSupply();
            this.totalBurned = (this.originalSupplyAmount - tokenSupply.uiAmount).toFixed(2);
            console.log("Total Burned: ", this.totalBurned)
        } catch (error) {
            console.error(error);
        }
    }

    async getMintAddress(accountInfo) {
        const accountId = new PublicKey(accountInfo.accountId);

        // Check if the account is a token account
        if (!accountInfo.accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
            throw new Error('Account is not a token account');
        }

        // Deserialize account data
        const tokenAccountInfo = await getAccount(this.connection, accountId, "confirmed");

        // Get mint address
        return tokenAccountInfo.mint.toBase58();
    }

    async subscribeToTokenAccount() {
        try {
            const subscriptionId = await this.connection.onProgramAccountChange(
                TOKEN_PROGRAM_ID, // SPL Token program public key
                async (accountInfo) => {
                    try {
                        const mintAddress = await this.getMintAddress(accountInfo);
                        if (mintAddress === this.tokenPublicKey.toBase58()) {
                            await this.checkTokenAccountChanged();
                            console.log('Checked token account changes');
                        }
                    } catch (error) {
                        console.error('Error in checking token account changes:', error);
                    }
                },
                "finalized",
                [{ memcmp: { offset: 0, bytes: this.tokenPublicKey.toBase58() } }] // Filter for the specific token
            );

            console.log('Tracking burn events with subscription ID:', subscriptionId);
            return subscriptionId;
        } catch (error) {
            console.error('Error in subscription:', error);
            throw error;
        }
    }


    startPolling = async () => {

        setInterval(async () => {
            try {
                await this.checkTokenAccountChanged();
            } catch (error) {
                console.error(error);
            }
        }, 10000);
    }
}


module.exports = TokenMonitor;