# FAQ

## Why did my transaction fail?

### Slippage and price change
In most cases, your transaction will fail if prices change too far from your combo or if you don't take slippage into account.
You can avoid these failures by more room for price changes.

Let's say that you want to swap 1ETH to 2000USDC, and then add USDC to a liquidity pool.
Here's how to create a good combo:
- Swap 1 ETH for 2000 USDC
- Provide liquidity for 1 ETH and 1980 USDC

On the other hand, this would be a bad combo:
- Swap 1 ETH for 2000 USDC
- Provide liquidity for 1 ETH and 2000 USDC

This is because of _slippage_ and _price changes_. With a slippage set at 0.05%, the first swap would give you anywhere between 1990 and 2000 USDC.
If you try to add 2000 USDC to the pool but the first swap only gave you 1990, the transaction will fail because your balance won't be sufficient.

### Max fee
Sometimes, your transaction can fail if the transaction fee was not high enough. Retry a few times!

## How can I change the 'Initial Funds' amounts?
These funds are automatically calculated when you input the numbers in the blocks.

## I sent a transaction and an action is missing
Make sure that you have _set_ all the blocks before sending a transaction
