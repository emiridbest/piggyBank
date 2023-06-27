// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PiggyBank {
    address payable owner;
    uint256 public depositTime;
    uint256 public lockDuration = 1 weeks;
    bool public isDepositMade = false;

    constructor() {
        owner = payable(msg.sender);
    }

    event Deposited(uint256 amount);
    event Withdrawn(uint256 amount);

    function deposit() public payable {
        require(
            msg.sender == owner,
            "Only the contract owner can deposit funds"
        );
        require(
            isDepositMade == false,
            "Deposit is already made, wait until withdrawal"
        );
        depositTime = block.timestamp;
        isDepositMade = true;
        emit Deposited(msg.value);
    }

    function timeSinceDeposit() public view returns (uint256) {
        require(isDepositMade == true, "No deposit has been made yet");
        return block.timestamp - depositTime;
    }

    function canWithdraw() public view returns (bool) {
        require(isDepositMade == true, "No deposit has been made yet");
        return timeSinceDeposit() >= lockDuration;
    }

    function withdraw() public {
        require(
            msg.sender == owner,
            "Only the contract owner can withdraw funds"
        );
        require(canWithdraw(), "Cannot withdraw before lock duration");
        uint256 amount = address(this).balance;
        owner.transfer(amount);
        isDepositMade = false;
    }
}
