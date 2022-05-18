const main = async () => {
    const votingContractFactory = await hre.ethers.getContractFactory('Voting');
    const votingContract = await votingContractFactory.deploy();
    await votingContract.deployed();
    console.log("Contract deployed to:", votingContract.address);
  };
  
  const runMain = async () => {
    try {
      await main();
      process.exit(0);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  };
  
  runMain();