import { getContributionsApi } from "#/api/groups/groups-api.tsx";
import { useQuery } from "@tanstack/react-query";

export default function Contributions(props: any) {
  const query = useQuery({
    queryKey: ["contributions", props],
    queryFn: () => getContributionsApi(props),
  });
  return <></>;
}
