pragma solidity ^0.5.0;
import "./ERC721.sol";

contract Color is ERC721 {
    string[] public colors;
    mapping(string => bool) _colorExists;
    uint256 public count = 0;
    mapping(uint256 => address payable) public owner;
    mapping(uint256 => uint256) bidtime;
    function mint(string memory _color) public {
        if (_colorExists[_color]) {
            revert("Token with similiar color already exists");
        }
        uint256 _id = colors.push(_color);
        _mint(msg.sender, _id);
        _colorExists[_color] = true;
        owner[count] = msg.sender;
         count++;
    }

    uint256 auctionEnd;
    mapping(uint256 => address payable) public beneficiary;
    mapping(uint256 => bool) ended;

    function startAuction(uint256 _count, uint256 _time) public returns (bool) {
        if (_count > count) {
            revert("Please select a valid token");
        }
        if (msg.sender != owner[_count]) {
            revert("You don't own this token");
        }
        bidtime[_count] = block.timestamp + _time;
        beneficiary[_count] = msg.sender;
    }

    mapping(uint256 => uint256) public highestbid;
    uint256 amount;
    mapping(uint256 => address payable) public highestbidder;
    mapping(address => uint256) public pendingReturns;
    event highestbidIncrease(address bidder, uint256 amount);
    event AuctionEnded(address __highestbidder, uint256 __amount);

    function bid(uint256 _count) public payable {
        if (block.timestamp>bidtime[_count]) {
            revert("Auction has Ended");
        }
        if (msg.value <= highestbid[_count]) {
            revert("Higher or Equal bid already exists");
        }
        if (highestbid[_count] != 0) {
            pendingReturns[highestbidder[count]] += highestbid[_count];
        }
        highestbid[_count] = msg.value;
        highestbidder[count] = msg.sender;
        emit highestbidIncrease(msg.sender, msg.value);
    }

    address payable new1;

    function withdraw(uint256 _count) public returns (bool) {
        if (msg.sender == highestbidder[_count]) {
            revert(
                "You can't withdraw the amount unless someone bids higher than you"
            );
        }
        amount = pendingReturns[msg.sender];
        if (amount > 0) {
            pendingReturns[msg.sender] = 0;
            new1 = msg.sender;
            if (!new1.send(amount)) {
                pendingReturns[msg.sender] = amount;
                return false;
            }
        }
        return true;
    }

    function auctionend(uint256 _count) public {
        if (block.timestamp < auctionEnd) {
            revert("Auction is still running");
        }
        if (ended[_count]) {
            revert("Function has been called before");
        }
        ended[_count] = true;
        emit AuctionEnded(highestbidder[_count], highestbid[_count]);
        beneficiary[_count].transfer(highestbid[_count]);
        new1 = highestbidder[_count];
        owner[_count] = new1;
    }
}
