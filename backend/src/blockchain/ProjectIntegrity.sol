// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ProjectIntegrity
 * @dev Decentralized verification system for project manifest integrity
 * @notice Stores SHA-256 hashes of project manifests on-chain for tamper-proof verification
 * 
 * Deployment Networks:
 * - Polygon (recommended): Low gas fees (~$0.001/tx)
 * - Arbitrum: Fast finality
 * - Optimism: Alternative L2
 * 
 * Usage:
 * 1. Generate manifest hash: sha256sum manifest.json
 * 2. Store on-chain: storeManifestHash(hash, version)
 * 3. Verify integrity: verifyManifest(hash) returns true/false
 */
contract ProjectIntegrity {
    /// @dev Struct to hold hash records with metadata
    struct ManifestRecord {
        string hash;        // SHA-256 or Keccak256 hash of manifest.json
        uint256 timestamp;  // Block timestamp when stored
        address uploader;   // Address that stored the hash
        string version;     // Optional version tag (e.g., "v1.2.3")
        bool isRevoked;     // Flag for revoking compromised records
    }

    /// @dev Array of all records (append-only for audit trail)
    ManifestRecord[] public records;
    
    /// @dev Mapping for quick lookup by version tag
    mapping(string => uint256) public versionToRecordIndex;
    
    /// @dev Access control - owner can revoke compromised records
    address public owner;
    
    /// @dev Emergency pause mechanism
    bool public paused;

    /// @notice Emitted when a new manifest hash is stored
    event ManifestStored(
        uint256 indexed recordId,
        string hash,
        uint256 timestamp,
        address indexed uploader,
        string version
    );
    
    /// @notice Emitted when a record is revoked
    event ManifestRevoked(
        uint256 indexed recordId,
        string reason,
        address indexed revokedBy
    );
    
    /// @notice Emitted when contract is paused/unpaused
    event PauseToggled(bool isPaused, address indexed by);

    /// @dev Modifier to restrict functions to owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /// @dev Modifier to check if contract is not paused
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    /// @notice Constructor sets the deployer as owner
    constructor() {
        owner = msg.sender;
        paused = false;
    }

    /**
     * @notice Store a new manifest hash on-chain
     * @param _hash SHA-256 hash of manifest.json (hex string)
     * @param _version Version tag (e.g., "v1.2.3", "2024-11-30")
     * @dev Emits ManifestStored event for off-chain indexing
     */
    function storeManifestHash(string memory _hash, string memory _version) 
        public 
        whenNotPaused 
        returns (uint256) 
    {
        require(bytes(_hash).length > 0, "Hash cannot be empty");
        require(bytes(_version).length > 0, "Version cannot be empty");
        
        uint256 recordId = records.length;
        
        records.push(ManifestRecord({
            hash: _hash,
            timestamp: block.timestamp,
            uploader: msg.sender,
            version: _version,
            isRevoked: false
        }));
        
        versionToRecordIndex[_version] = recordId;

        emit ManifestStored(recordId, _hash, block.timestamp, msg.sender, _version);
        
        return recordId;
    }

    /**
     * @notice Get the latest non-revoked manifest hash
     * @return hash The manifest hash
     * @return timestamp When it was stored
     * @return uploader Address that uploaded it
     * @return version Version tag
     */
    function getLatestManifestHash() 
        public 
        view 
        returns (
            string memory hash, 
            uint256 timestamp, 
            address uploader,
            string memory version
        ) 
    {
        require(records.length > 0, "No manifest stored yet");
        
        // Search backwards for latest non-revoked record
        for (uint256 i = records.length; i > 0; i--) {
            ManifestRecord memory record = records[i - 1];
            if (!record.isRevoked) {
                return (record.hash, record.timestamp, record.uploader, record.version);
            }
        }
        
        revert("No valid manifest found");
    }
    
    /**
     * @notice Get manifest by version tag
     * @param _version Version tag to query
     * @return hash The manifest hash
     * @return timestamp When it was stored
     * @return uploader Address that uploaded it
     * @return isRevoked Whether this record is revoked
     */
    function getManifestByVersion(string memory _version)
        public
        view
        returns (
            string memory hash,
            uint256 timestamp,
            address uploader,
            bool isRevoked
        )
    {
        uint256 recordId = versionToRecordIndex[_version];
        require(recordId < records.length, "Version not found");
        
        ManifestRecord memory record = records[recordId];
        return (record.hash, record.timestamp, record.uploader, record.isRevoked);
    }

    /**
     * @notice Verify if given hash matches the latest valid stored hash
     * @param _hash Hash to verify against on-chain record
     * @return isValid True if hash matches latest non-revoked record
     */
    function verifyManifest(string memory _hash) 
        public 
        view 
        returns (bool isValid) 
    {
        require(records.length > 0, "No manifest stored yet");
        
        (string memory latestHash, , , ) = getLatestManifestHash();
        
        return (keccak256(abi.encodePacked(latestHash)) == 
                keccak256(abi.encodePacked(_hash)));
    }

    /**
     * @notice Get total number of stored records
     * @return count Total records (including revoked)
     */
    function getRecordCount() public view returns (uint256 count) {
        return records.length;
    }
    
    /**
     * @notice Get a specific record by ID
     * @param _recordId Record index to query
     * @return hash Manifest hash
     * @return timestamp Storage timestamp
     * @return uploader Uploader address
     * @return version Version tag
     * @return isRevoked Revocation status
     */
    function getRecord(uint256 _recordId)
        public
        view
        returns (
            string memory hash,
            uint256 timestamp,
            address uploader,
            string memory version,
            bool isRevoked
        )
    {
        require(_recordId < records.length, "Record ID out of bounds");
        ManifestRecord memory record = records[_recordId];
        return (record.hash, record.timestamp, record.uploader, record.version, record.isRevoked);
    }

    /**
     * @notice Revoke a compromised record (owner only)
     * @param _recordId Record index to revoke
     * @param _reason Reason for revocation
     * @dev Does not delete (append-only audit trail), just marks as revoked
     */
    function revokeRecord(uint256 _recordId, string memory _reason) 
        public 
        onlyOwner 
    {
        require(_recordId < records.length, "Record ID out of bounds");
        require(!records[_recordId].isRevoked, "Record already revoked");
        
        records[_recordId].isRevoked = true;
        
        emit ManifestRevoked(_recordId, _reason, msg.sender);
    }

    /**
     * @notice Pause/unpause contract (owner only)
     * @param _paused New pause state
     * @dev Emergency mechanism to halt new submissions if exploit detected
     */
    function setPaused(bool _paused) public onlyOwner {
        paused = _paused;
        emit PauseToggled(_paused, msg.sender);
    }
    
    /**
     * @notice Transfer ownership (owner only)
     * @param _newOwner Address of new owner
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
}
