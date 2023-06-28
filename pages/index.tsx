import React, { useState, useCallback, useEffect } from 'react';
import { contractAddress, contractAbi } from '../abi/PiggyBank';
import { useEthersSigner } from './hook';
import { ethers } from 'ethers';

export default function Home() {
  const signer = useEthersSigner();
  const cUsdTokenAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [celoBalance, setCeloBalance] = useState<number>(0);
  const [cusdBalance, setCusdBalance] = useState<number>(0);
  const [selectedToken, setSelectedToken] = useState<string>('CELO');

  const getBalance = useCallback(async () => {
    if (!signer) return;

    const address = await signer.getAddress();
    if (!address) return;

    const contract = new ethers.Contract(contractAddress, contractAbi, signer);

    if (selectedToken === 'CELO') {
      const balanceStruct = await contract.balances(address);
      if (balanceStruct) {
        const celoBalance = balanceStruct.celoBalance;
        setCeloBalance(parseFloat(ethers.utils.formatEther(celoBalance.toString())));
      }
    } else if (selectedToken === 'cUSD') {
      const cUsdBalance = await contract.getBalance(address, cUsdTokenAddress);
      setCusdBalance(parseFloat(ethers.utils.formatEther(cUsdBalance.toString())));
    }
  }, [signer, selectedToken]);

  const handleTokenChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedToken(event.target.value);
  }

  const handleDeposit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!depositAmount || !selectedToken || !signer) return;

    const contract = new ethers.Contract(contractAddress, contractAbi, signer);
    const depositValue = ethers.utils.parseEther(depositAmount);
    const gasLimit = ethers.utils.hexlify(6000000);

    if (selectedToken === 'CELO') {
      await contract.deposit(ethers.constants.AddressZero, depositValue, { gasLimit });
    } else if (selectedToken === 'cUSD') {
      await contract.deposit(cUsdTokenAddress, depositValue, { gasLimit });
    }

    getBalance();
    setDepositAmount('');
  };

  const handleWithdraw = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!signer) return;

    const contract = new ethers.Contract(contractAddress, contractAbi, signer);

    if (selectedToken === 'CELO') {
      await contract.withdraw(ethers.constants.AddressZero);
    } else if (selectedToken === 'cUSD') {
      await contract.withdraw(cUsdTokenAddress);
    }

    getBalance();
  };

  useEffect(() => {
    getBalance();
  }, [getBalance]);


  return (
    <div className="h-3/4 bg-blue-500 flex items-center justify-center">
      <div className="bg-white bg-opacity-5 rounded-lg p-8 shadow-lg text-white w-96">
        <h2 className="text-4xl font-bold mb-6 text-center text-white uppercase tracking-wider border-b-2 border-blue-300 pb-2">PiggyBank</h2>
        <h3>Your CELO Balance: {celoBalance} CELO</h3>
        <h3>Your cUSD Balance: {cusdBalance} cUSD</h3>
        <form onSubmit={handleDeposit} className="mb-4">
          <select onChange={handleTokenChange} value={selectedToken} className=" bg-blue-500">
            <option value="CELO">CELO</option>
            <option value="cUSD">cUSD</option>
          </select>
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
