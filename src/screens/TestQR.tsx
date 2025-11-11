import React, { useState } from "react";
import { View, Button } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function TestQR() {
  const [show, setShow] = useState(false);

  return (
    <View style={{ padding: 50 }}>
      <Button title="Mostrar QR" onPress={() => setShow(true)} />
      {show && <QRCode value="TEST123" size={200} />}
    </View>
  );
}
