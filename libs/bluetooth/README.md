# EV3 Bluetooth Brick-to-Brick Messaging

Send and receive messages between two (or more) EV3 bricks over Bluetooth, just like the Bluetooth blocks in EV3-G.

## Setup

1. **Pair the bricks** using the EV3 on-brick Bluetooth menu (Settings → Bluetooth → Search). Do this before running any program.
2. One brick acts as the **master** (calls `connectToBrick`), the other just listens.

## Blocks

### Connect

```typescript
bluetooth.connectToBrick("EV3")
```

### Send a number

```typescript
bluetooth.sendNumberMessage("speed", 75)
```

### Receive a number

```typescript
bluetooth.onNumberReceived("speed", function (receivedNumber) {
    motors.largeAB.run(receivedNumber)
})
```

## Mailbox types

| Type   | EV3-G equivalent |
|--------|-----------------|
| text   | Text message    |
| number | Numeric message |
| logic  | Logic message   |

## Limits

- Up to **7** simultaneous connections (Bluetooth piconet limit — same as EV3-G)
- Mailbox name length: up to 248 characters
- Message size: up to 1024 bytes

## License

MIT
