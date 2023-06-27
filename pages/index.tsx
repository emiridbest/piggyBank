import React, { useState, FormEvent } from 'react';
import { contractAddress, contractAbi } from '../abi/PiggyBank';
import { useEthersSigner } from './hook';
import { ethers } from 'ethers';


export default function Home() {
  const signer = useEthersSigner();
  const [depositAmount, setDepositAmount] = useState<string>('');

  const handleDeposit = async (event: FormEvent) => {
    event.preventDefault();
    console.log("depositing");

    if (!depositAmount || !signer) return;
    const contract = new ethers.Contract(contractAddress, contractAbi, signer);
    const celoValue = ethers.utils.parseEther(depositAmount);
    const gasLimit = ethers.utils.hexlify(6000000);
    await contract.deposit({ value: celoValue, gasLimit: gasLimit });
    setDepositAmount('');
  };

  const handleWithdraw = async (event: FormEvent) => {
    event.preventDefault();
    if (!signer) return;
    console.log("withdrawing");
    const contract = new ethers.Contract(contractAddress, contractAbi, signer);
    await contract.withdraw();
  };

  return (
    <div className="h-3/4 bg-blue-500 flex items-center justify-center">
      <div className="bg-white bg-opacity-5 rounded-lg p-8 shadow-lg text-white w-96">
        <h2 className="text-4xl font-bold mb-6 text-center text-white uppercase tracking-wider border-b-2 border-blue-300 pb-2">PiggyBank</h2>
        <form onSubmit={handleDeposit} className="mb-4">
          <input
            type="number"
            step="0.01"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="rounded px-4 py-2 w-full mb-2 text-black"
          />
          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 rounded py-2"
          >
            Deposit
          </button>
        </form>
        <button
          onClick={handleWithdraw}
          className="w-full bg-blue-700 hover:bg-blue-800 rounded py-2 mb-2"
        >
          Withdraw
        </button>
      </div>
    </div>
  );
}
