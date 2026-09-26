import { SkeletonAvatar, SkeletonRegion, SkeletonText } from "./skeleton";

export default function Example() {
  return (
    <SkeletonRegion label="Loading profile">
      <div className="ml-cluster">
        <SkeletonAvatar size={40} />
        <SkeletonText lines={2} />
      </div>
    </SkeletonRegion>
  );
}
