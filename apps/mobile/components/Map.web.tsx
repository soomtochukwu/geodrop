import React from "react";
import { View } from "react-native";

export const MapView = React.forwardRef((props: any, ref: any) => (
  <View {...props} ref={ref} />
));

export const Marker = (props: any) => <View {...props} />;
export const Circle = (props: any) => <View {...props} />;

export default MapView;
