const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  let owner;
  let acc1;
  let acc2;
  let votingContract;
  const candidates = ["0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB","0x583031D1113aD414F02576BD6afaBfb302140225","0xdD870fA1b7C4700F2BD7f44238821C26f7392148"];

  beforeEach(async function () {
    [owner, acc1, acc2] = await ethers.getSigners();

    const Voting = await ethers.getContractFactory("Voting");
    votingContract = await Voting.deploy();
    await votingContract.deployed();
  });

  it("test 1", async function() {
    const votingId = await votingContract.newVoting(
        candidates
    );
    const votingData = await votingContract.getVotingById(votingId.value);

    expect(votingId.value).to.eq(0);
    expect(votingData._balance).to.eq(0);
    expect(votingData._participants).to.empty;
    expect(votingData._candidates).to.eql(candidates);

    await expect(votingContract.closeVoting(votingId.value)).to.be.revertedWith("Voting is in progress!");
    await hre.ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
    await expect(votingContract.closeVoting(votingId.value)).to.be.revertedWith("Voting is closed!");
  });

  it("test 2", async function() {
    const votingId = await votingContract.newVoting(
        candidates
    );

    const vote = await votingContract.connect(acc1).vote(votingId.value, "0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB", {value: ethers.utils.parseEther("0.01")});
    await expect(votingContract.connect(acc1).vote(votingId.value, "0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB", {value: ethers.utils.parseEther("0.01")})).to.be.revertedWith("Already voted");
    await expect(votingContract.connect(acc2).vote(votingId.value, "0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB", {value: ethers.utils.parseEther("0.02")})).to.be.revertedWith("Wrong price! Should be 0.01 ether");
    await expect(votingContract.connect(acc2).vote(votingId.value, "0x07aDa95e0463306CBC59E5bC91Bdb3C5EcAB66B9", {value: ethers.utils.parseEther("0.01")})).to.be.revertedWith("No such candidate");
    await hre.ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
    await expect(votingContract.connect(acc2).vote(votingId.value, "0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB", {value: ethers.utils.parseEther("0.01")})).to.be.revertedWith("Expired!");
  });

  it("test 3", async function() {
    const votingId = await votingContract.newVoting(
        candidates
    );

    await votingContract.connect(acc1).vote(votingId.value, "0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB", {value: ethers.utils.parseEther("0.01")});
    await votingContract.connect(acc2).vote(votingId.value, "0x583031D1113aD414F02576BD6afaBfb302140225", {value: ethers.utils.parseEther("0.01")});
    await hre.ethers.provider.send('evm_increaseTime', [3 * 24 * 60 * 60]);
    await votingContract.closeVoting(votingId.value);

    await expect(votingContract.connect(acc1).withdraw("0x07aDa95e0463306CBC59E5bC91Bdb3C5EcAB66B9")).to.be.revertedWith("not an owner!");
    await votingContract.withdraw("0x07aDa95e0463306CBC59E5bC91Bdb3C5EcAB66B9");
  });

  // Didn't find how to mock call{value: prize} and test require(success, "Failed to transfer."); - it is the only uncovered bruch line
  
})