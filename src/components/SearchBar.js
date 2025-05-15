function SearchBar({ setSearch }) {
    return (
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-full max-w-md"
        />
      </div>
    );
  }
  
  export default SearchBar;