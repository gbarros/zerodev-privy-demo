[Privy Docs home page![light logo](https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/logo/privy-logo-light.png?maxW=778&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=c362e762bc1c1da26b1efff5b4d88cd6)![dark logo](https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/logo/privy-logo-dark.png?maxW=778&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=1e86ace7c2f126aafd35c65805dcf64b)](https://docs.privy.io/)

Search...

Ctrl KAsk AI

Search...

Navigation

Wallet infrastructure

Custom account abstraction implementation

[Welcome](https://docs.privy.io/welcome) [Basics](https://docs.privy.io/basics/get-started/about) [Authentication](https://docs.privy.io/authentication/overview) [Wallets](https://docs.privy.io/wallets/overview) [Connectors](https://docs.privy.io/wallets/connectors/overview) [Policies & controls](https://docs.privy.io/controls/overview) [Transaction management](https://docs.privy.io/transaction-management/overview) [User management](https://docs.privy.io/user-management/overview) [Security](https://docs.privy.io/security/overview) [Recipes](https://docs.privy.io/recipes/overview) [API reference](https://docs.privy.io/api-reference/introduction)

On this page

- [Account abstraction with ZeroDev](https://docs.privy.io/recipes/account-abstraction/custom-implementation#account-abstraction-with-zerodev)
- [1\. Install the required dependencies from Privy and ZeroDev](https://docs.privy.io/recipes/account-abstraction/custom-implementation#1-install-the-required-dependencies-from-privy-and-zerodev)
- [2\. Sign up for a ZeroDev account and get your project ID](https://docs.privy.io/recipes/account-abstraction/custom-implementation#2-sign-up-for-a-zerodev-account-and-get-your-project-id)
- [2\. Configure your app’s Privy settings](https://docs.privy.io/recipes/account-abstraction/custom-implementation#2-configure-your-app%E2%80%99s-privy-settings)
- [3\. Create a smart account for your user](https://docs.privy.io/recipes/account-abstraction/custom-implementation#3-create-a-smart-account-for-your-user)
- [4\. Send user operations (transactions) from the smart account](https://docs.privy.io/recipes/account-abstraction/custom-implementation#4-send-user-operations-transactions-from-the-smart-account)

Privy now allows you to natively use smart wallet for a better developer experience. Check out the
docs [here](https://docs.privy.io/wallets/using-wallets/evm-smart-wallets/overview).

- ZeroDev
- Safe
- Pimlico
- Biconomy
- AccountKit

## [​](https://docs.privy.io/recipes/account-abstraction/custom-implementation\#account-abstraction-with-zerodev)  Account abstraction with ZeroDev

[ZeroDev](https://zerodev.app/) is a toolkit for creating [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337)-compatible smart wallets for your users, using the user’s EOA as the smart wallet’s signer. This allows you to easily add [Account Abstraction](https://ethereum.org/en/roadmap/account-abstraction/) features into your app.**You can easily integrate ZeroDev alongside Privy to create smart wallets from your user’s embedded or external wallets, allowing you to enhance your app with gas sponsorship, batched transactions, and more!**Read below to learn how to configure your app to create smart wallets for _all_ your users!

### [​](https://docs.privy.io/recipes/account-abstraction/custom-implementation\#1-install-the-required-dependencies-from-privy-and-zerodev)  1\. Install the required dependencies from Privy and ZeroDev

In your app’s repository, install the required dependencies from Privy and ZeroDev, as well as the [`permissionless`](https://www.npmjs.com/package/permissionless), and [`viem`](https://www.npmjs.com/package/viem) libraries:

Copy

Ask AI

```
npm i @privy-io/react-auth @zerodev/sdk @zerodev/ecdsa-validator permissionless viem

```

### [​](https://docs.privy.io/recipes/account-abstraction/custom-implementation\#2-sign-up-for-a-zerodev-account-and-get-your-project-id)  2\. Sign up for a ZeroDev account and get your project ID

Visit the [**ZeroDev dashboard**](https://dashboard.zerodev.app/) and sign up for a new account if you do not have one already. Set up a new project for your required chain(s) and retrieve your ZeroDev **project ID**, as well as your **paymaster and bundler URLs** for the project.Within this Dashboard, you can also configure [settings for gas sponsorship and other ZeroDev features](https://docs.zerodev.app/sdk/getting-started/tutorial)!

### [​](https://docs.privy.io/recipes/account-abstraction/custom-implementation\#2-configure-your-app%E2%80%99s-privy-settings)  2\. Configure your app’s Privy settings

First, follow the instructions in the [**Privy Quickstart**](https://docs.privy.io/basics/react/quickstart) to get your app set up with a basic Privy integration.Next, set **Add confirmation modals** to “off” in your app’s \[ **Embedded wallets**\] page in the Privy [**dashboard**](https://dashboard.privy.io/). This will configure Privy to _not_ show its default UIs when your user must sign messages or send transactions. Instead, we recommend you use your own custom UIs for showing users the [user operations](https://www.alchemy.com/overviews/user-operations) s they sign.Lastly, update the **`config.embeddedWallets.createOnLogin`** property of your **`PrivyProvider`** to `'users-without-wallets'`.This will configure Privy to create an embedded wallet for users logging in via a web2 method (email, phone, socials), ensuring that _all_ of your users have a wallet that can be used as an EOA.Your **`PrivyProvider`** should then look like:

Copy

Ask AI

```
<PrivyProvider
    appId='insert-your-privy-app-id'
    config={{
        embeddedWallets: {
            createOnLogin: 'users-without-wallets',
        }
        ...insertTheRestOfYourPrivyProviderConfig
    }}
>
    {/* Your app's components */}
</PrivyProvider>

```

### [​](https://docs.privy.io/recipes/account-abstraction/custom-implementation\#3-create-a-smart-account-for-your-user)  3\. Create a smart account for your user

You’ll now create a smart account for your user, using the Privy embedded wallet (an EOA) as the signer.To do so, when the user logs in, first find the user’s embedded wallet from Privy’s **`useWallets`** hook, and get its [EIP1193 provider](https://docs.privy.io/wallets/using-wallets/ethereum/web3-integrations). You can find embedded wallet by finding the only entry in the **`useWallets`** array with a **`walletClientType`** of `'privy'`.

Copy

Ask AI

```
import {useWallets} from '@privy-io/react-auth';
import {sepolia} from 'viem/chains'; // Replace this with the chain used by your application
import {createWalletClient, custom} from 'viem';
...
// Find the embedded wallet and get its EIP1193 provider
const {wallets} = useWallets();
const embeddedWallet = wallets.find((wallet) => (wallet.walletClientType === 'privy'));
const provider = await embeddedWallet.getEthereumProvider();

```

Next, pass the returned EIP1193 `provider` to the [`providerToSmartAccountSigner`](https://docs.pimlico.io/references/permissionless/v0_1/reference/utils/providerToSmartAccountSigner) method from `permissionless` to create a [`SmartAccountSigner`](https://docs.pimlico.io/references/permissionless/how-to/signers#signers-for-permissionlessjs). This signer corresponds to the user’s embedded wallet and authorizes actions for the user’s smart account.

Copy

Ask AI

```
import { providerToSmartAccountSigner } from 'permissionless';
...
// Use the EIP1193 `provider` from Privy to create a `SmartAccountSigner`
const smartAccountSigner = await providerToSmartAccountSigner(provider);

```

Finally, using the `smartAccountSigner` from above, initialize a Kernel (ZeroDev) smart account for the user like so:

Copy

Ask AI

```
import {sepolia} from 'viem/chains'; // Replace this with the chain used by your application
import {createPublicClient, http} from 'viem';
import {ENTRYPOINT_ADDRESS_V07} from 'permissionless';
import {createZeroDevPaymasterClient, createKernelAccount, createKernelAccountClient} from "@zerodev/sdk";
import {signerToEcdsaValidator} from "@zerodev/ecdsa-validator";

...

// Initialize a viem public client on your app's desired network
const publicClient = createPublicClient({
  transport: http(sepolia.rpcUrls.default.http[0]),
})

// Create a ZeroDev ECDSA validator from the `smartAccountSigner` from above and your `publicClient`
const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
  signer: smartAccountSigner,
  entryPoint: ENTRYPOINT_ADDRESS_V07,
})

// Create a Kernel account from the ECDSA validator
const account = await createKernelAccount(publicClient, {
  plugins: {
    sudo: ecdsaValidator,
  },
   entryPoint: ENTRYPOINT_ADDRESS_V07,
});

// Create a Kernel account client to send user operations from the smart account
const kernelClient = createKernelAccountClient({
    account,
    chain: sepolia,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    bundlerTransport: http('insert-your-bundler-RPC-from-the-dashboard'),
    middleware: {
      sponsorUserOperation: async ({ userOperation }) => {
        const zerodevPaymaster = createZeroDevPaymasterClient({
          chain: sepolia,
          entryPoint: ENTRYPOINT_ADDRESS_V07,
          transport: http('insert-your-paymaster-RPC-to-the-dashboard'),
        })
        return zerodevPaymaster.sponsorUserOperation({
          userOperation,
          entryPoint: ENTRYPOINT_ADDRESS_V07,
        })
      }
    }
  })

```

The `kernelClient` is a drop-in replacement for a `viem` [Wallet Client](https://viem.sh/docs/clients/wallet.html), and requests to the smart account can be made using [`viem`’s API](https://docs.zerodev.app/sdk/core-api/send-transactions).

You can also store the user’s smart account address on Privy’s user object. See [this\\
guide](https://docs.privy.io/recipes/account-abstraction/address.md) for more.

### [​](https://docs.privy.io/recipes/account-abstraction/custom-implementation\#4-send-user-operations-transactions-from-the-smart-account)  4\. Send user operations (transactions) from the smart account

Now that your users have Kernel (ZeroDev) smart accounts, they can now send [**UserOperations**](https://eips.ethereum.org/EIPS/eip-4337) from their smart account. This is the AA analog to sending a transaction.**To send a user operation from a user’s smart account, use the Kernel client’s [`sendTransaction`](https://docs.zerodev.app/sdk/core-api/send-transactions#sending-transactions-1) method.**

Copy

Ask AI

```
const txHash = await kernelClient.sendTransaction({
  to: 'TO_ADDRESS',
  value: VALUE, // default to 0
  data: '0xDATA' // default to 0x
});

```

This is a drop-in replacement for viem’s [`sendTransaction`](https://viem.sh/docs/actions/wallet/sendTransaction.html) method, and will automatically apply any smart account configurations (e.g. gas sponsorship) you configure in the `middleware` before sending the transaction.**That’s it! You’ve configured your app to create smart wallets for all of your users, and can seamlessly add in AA features like gas sponsorship, batched transactions, and more.** 🎉

[Using chains with Tier 2 support](https://docs.privy.io/recipes/use-tier-2) [Storing smart account addresses](https://docs.privy.io/recipes/account-abstraction/address)

Assistant

Responses are generated using AI and may contain mistakes.