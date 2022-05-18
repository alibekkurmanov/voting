//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Voting {

    uint constant votePrice = 0.01 ether;
    uint constant duration = 3 days;

    address owner;
    uint earnedTax;
    uint public votingCounter;
    struct VoteStruct {
        uint balance;
        uint expirationTime;
        address[] candidates;
        address[] participants;
        mapping(address => uint) votes; // candidate -> votes
    }
    mapping (uint => VoteStruct) votings;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not an owner!");
        _;
    }
     
    function newVoting(address[] memory _candidates) public onlyOwner returns(uint currentVotingId) {
        currentVotingId = votingCounter++;
        VoteStruct storage vs = votings[currentVotingId];
        vs.expirationTime = block.timestamp + duration;
        vs.candidates = _candidates;
    }

    function getVotingById(uint _id) public view returns(uint _balance, uint _expirationTime, address[] memory _participants, address[] memory _candidates, uint[] memory _votes) {
        _balance = votings[_id].balance;
        _expirationTime = votings[_id].expirationTime;
        _participants = votings[_id].participants;
        uint totalCandidates = votings[_id].candidates.length;
        _candidates = new address[](totalCandidates);
        _votes = new uint[](totalCandidates);
        for (uint i = 0 ; i < totalCandidates ; i++) {
            _candidates[i] = votings[_id].candidates[i];
            _votes[i] = votings[_id].votes[votings[_id].candidates[i]];
        }
    }

    function isVoted(uint _id, address _participants) private view returns(bool) {
        for (uint i = 0 ; i < votings[_id].participants.length ; i++) {
            if (votings[_id].participants[i] == _participants) return true;
        }
        return false; 
    }

    function isCandidate(uint _id, address _candidate) private view returns(bool) {
        for (uint i = 0 ; i < votings[_id].candidates.length ; i++) {
            if (votings[_id].candidates[i] == _candidate) return true;
        }
        return false;
    }

    function vote(uint _id, address _candidate) public payable {
        require(votings[_id].expirationTime > block.timestamp , "Expired!");
        require(msg.value == votePrice, "Wrong price! Should be 0.01 ether");
        require(isCandidate(_id, _candidate), "No such candidate");
        require(!isVoted(_id, msg.sender), "Already voted");
        votings[_id].balance += msg.value;
        votings[_id].participants.push(msg.sender);
        votings[_id].votes[_candidate]++;
    }

    function getWinners(uint _id) private view returns(address[] memory) {
        uint maxVotes = 0;
        uint amountWinners;
        for (uint i = 0 ; i < votings[_id].candidates.length ; i++) {
            if (votings[_id].votes[votings[_id].candidates[i]] == maxVotes && maxVotes != 0) {
                amountWinners++;
            }
            if (votings[_id].votes[votings[_id].candidates[i]] > maxVotes) {
                maxVotes = votings[_id].votes[votings[_id].candidates[i]];
                amountWinners = 1;
            }
        }
        address[] memory winners = new address[](amountWinners);
        uint j;
        for (uint i = 0 ; i < votings[_id].candidates.length ; i++) {
            if (votings[_id].votes[votings[_id].candidates[i]] == maxVotes) {
                winners[j++] = votings[_id].candidates[i];
            }
        }
        return winners;
    }

    function closeVoting(uint _id) public payable {
        require(votings[_id].expirationTime < block.timestamp , "Voting is in progress!");
        require(votings[_id].balance > 0, "Voting is closed!");
        address[] memory winners = getWinners(_id);
        uint tax = votings[_id].balance * 10 / 100;
        earnedTax += tax;
        uint prize = (votings[_id].balance - tax) / winners.length;
        for (uint i = 0 ; i < winners.length ; i++) {
            address payable winner = payable(winners[i]);
            (bool success, ) = (winner).call{value: prize}("");
            require(success, "Failed to transfer.");
        }
        votings[_id].balance = 0;
    }

    function withdraw(address payable _to) external onlyOwner {
        _to.transfer(earnedTax);
    }
}
