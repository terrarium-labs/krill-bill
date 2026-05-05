const ScreenSizeDisplay = () => {
  return (
    <div
      className="
        fixed p-2 rounded-lg bottom-0 right-0 m-4 z-50 backdrop-blur border shadow-lg bg-red-500/50 sm:bg-orange-500/50 md:bg-yellow-500/50 lg:bg-green-500/50 xl:bg-blue-500/50 2xl:bg-purple-500/50"
    >
      <div className="text-xs font-mono font-bold">
        <div className="flex gap-2">
          <span className="sm:hidden">XS</span>
          <span className="hidden sm:inline md:hidden">SM</span>
          <span className="hidden md:inline lg:hidden">MD</span>
          <span className="hidden lg:inline xl:hidden">LG</span>
          <span className="hidden xl:inline 2xl:hidden">XL</span>
          <span className="hidden 2xl:inline">2XL</span>
        </div>
      </div>
    </div>
  );
};

export default ScreenSizeDisplay;
