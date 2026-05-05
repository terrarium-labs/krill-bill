export const FlagComponent = ({
  country,
  countryName,
}: {
  country: string;
  countryName: string;
}) => {
  if (!country || !countryName) return null;
  return (
    <span className="flex h-[0.87rem] w-[1.25rem] overflow-hidden rounded bg-foreground/20">
      <img
        src={`https://flagcdn.com/w40/${country.toLowerCase()}.png`}
        alt={`${countryName} flag`}
        title={countryName}
        className="h-full w-full object-cover"
      />
    </span>
  );
};
