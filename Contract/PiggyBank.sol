// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PiggyBank {
    struct TokenBalance {
        uint256 celoBalance;
        uint256 cUsdBalance;
        uint256 depositTime;
    }

    mapping(address => TokenBalance) public balances;
    uint256 public lockDuration = 1 weeks;
    address private constant CELO_TOKEN_ADDRESS = address(0);
    address private constant CUSD_TOKEN_ADDRESS =0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    event Deposited(
        address indexed depositor,
        uint256 amount,
        address indexed token
    );
    event Withdrawn(
        address indexed withdrawer,
        uint256 amount,
        address indexed token
    );

    receive() external payable {
        deposit(CELO_TOKEN_ADDRESS, msg.value);
    }

    function deposit(address tokenAddress, uint256 amount) public {
        if (tokenAddress == CELO_TOKEN_ADDRESS) {
            require(amount > 0, "CELO deposit amount must be greater than 0");
            TokenBalance storage celoBalance = balances[msg.sender];
            celoBalance.celoBalance += amount;
            celoBalance.depositTime = block.timestamp;
            emit Deposited(msg.sender, amount, CELO_TOKEN_ADDRESS);
        } else if (tokenAddress == CUSD_TOKEN_ADDRESS) {
            IERC20 cUsdToken = IERC20(CUSD_TOKEN_ADDRESS);
            require(
                cUsdToken.transferFrom(msg.sender, address(this), amount),
                "Transfer failed. Make sure to approve the contract to spend the cUSD tokens."
            );
            TokenBalance storage cUsdBalance = balances[msg.sender];
            cUsdBalance.cUsdBalance += amount;
            cUsdBalance.depositTime = block.timestamp;
            emit Deposited(msg.sender, amount, CUSD_TOKEN_ADDRESS);
        } else {
            revert("Unsupported token");
        }
    }

    function timeSinceDeposit(address depositor) public view returns (uint256) {
        return block.timestamp - balances[depositor].depositTime;
    }

    function canWithdraw(address depositor) public view returns (bool) {
        TokenBalance storage tokenBalance = balances[depositor];
        return ((tokenBalance.celoBalance > 0 &&
            timeSinceDeposit(depositor) >= lockDuration) ||
            (tokenBalance.cUsdBalance > 0 &&
                timeSinceDeposit(depositor) >= lockDuration));
    }

    function withdraw(address tokenAddress) public {
        require(
            canWithdraw(msg.sender),
            "Cannot withdraw before lock duration or no tokens deposited"
        );

        TokenBalance storage tokenBalance = balances[msg.sender];
        uint256 amount;

        if (tokenAddress == CELO_TOKEN_ADDRESS) {
            amount = tokenBalance.celoBalance;
            tokenBalance.celoBalance = 0;
            payable(msg.sender).transfer(amount);
        } else if (tokenAddress == CUSD_TOKEN_ADDRESS) {
            amount = tokenBalance.cUsdBalance;
            tokenBalance.cUsdBalance = 0;
            IERC20 cUsdToken = IERC20(CUSD_TOKEN_ADDRESS);
            require(cUsdToken.transfer(msg.sender, amount), "Transfer failed");
        } else {
            revert("Unsupported token");
        }

        emit Withdrawn(msg.sender, amount, tokenAddress);
    }

    function getBalance(address account, address tokenAddress)
        public
        view
        returns (uint256)
    {
        TokenBalance storage tokenBalance = balances[account];

        if (tokenAddress == CELO_TOKEN_ADDRESS) {
            return tokenBalance.celoBalance;
        } else if (tokenAddress == CUSD_TOKEN_ADDRESS) {
            return tokenBalance.cUsdBalance;
        } else {
            revert("Unsupported token");
        }
    }
}
