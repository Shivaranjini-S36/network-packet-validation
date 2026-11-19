const mongoose = require('mongoose');

const StateTransitionSchema = new mongoose.Schema(
  {
    step: { type: Number, required: true },
    fromState: { type: String, required: true },
    inputSymbol: { type: String, required: true },
    toState: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const PacketSchema = new mongoose.Schema(
  {
    packetId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    sourceIp: {
      type: String,
      required: true,
      trim: true
    },
    destinationIp: {
      type: String,
      required: true,
      trim: true
    },
    protocol: {
      type: String,
      required: true,
      uppercase: true,
      enum: ['TCP', 'UDP', 'ICMP', 'UNKNOWN'],
      trim: true
    },
    sourcePort: {
      type: Number,
      default: null
    },
    destinationPort: {
      type: Number,
      default: null
    },
    isValid: {
      type: Boolean,
      required: true,
      index: true
    },
    validationErrors: {
      type: [String],
      default: []
    },
    dfaClassification: {
      type: String,
      required: true,
      enum: ['TCP_PACKET', 'UDP_PACKET', 'ICMP_PACKET', 'REJECTED_PACKET'],
      index: true
    },
    dfaFinalState: {
      type: String,
      required: true,
      enum: ['ACCEPTED', 'REJECTED']
    },
    stateTransitions: {
      type: [StateTransitionSchema],
      default: []
    },
    fieldValidations: {
      sourceIpValid: { type: Boolean, default: false },
      destinationIpValid: { type: Boolean, default: false },
      protocolValid: { type: Boolean, default: false },
      portsValid: { type: Boolean, default: false }
    },
    rawInput: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Packet', PacketSchema);
