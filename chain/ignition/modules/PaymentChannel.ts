import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PaymentChannelModule", (m) => {
  const paymentChannel = m.contract("PaymentChannel");
  
  return { paymentChannel };
});