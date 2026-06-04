package com.acido303.transactionflow.producer.generator;

import com.acido303.transactionflow.producer.dto.GeneratorConfigDto;
import com.acido303.transactionflow.producer.model.TransactionEvent;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Component
public class TransactionGenerator {

    private static final Random RANDOM = new Random();

    // Mutable lists — CopyOnWriteArrayList for safe concurrent access
    private final CopyOnWriteArrayList<String> merchants = new CopyOnWriteArrayList<>(Arrays.asList(
            "Amazon", "Tesco", "Lidl", "Aldi", "Dunnes Stores",
            "Ryanair", "Aer Lingus", "Netflix", "Spotify", "Uber",
            "Bolt", "Apple", "Google", "Microsoft", "Booking.com"
    ));

    private final CopyOnWriteArrayList<String[]> countries = new CopyOnWriteArrayList<>(Arrays.asList(
            new String[]{"IE", "Ireland"},
            new String[]{"ES", "Spain"},
            new String[]{"GB", "United Kingdom"},
            new String[]{"FR", "France"},
            new String[]{"DE", "Germany"},
            new String[]{"NL", "Netherlands"},
            new String[]{"US", "United States"},
            new String[]{"PT", "Portugal"},
            new String[]{"IT", "Italy"},
            new String[]{"PL", "Poland"},
            new String[]{"BR", "Brazil"},
            new String[]{"AR", "Argentina"},
            new String[]{"MX", "Mexico"},
            new String[]{"CA", "Canada"},
            new String[]{"AU", "Australia"},
            new String[]{"JP", "Japan"},
            new String[]{"CN", "China"},
            new String[]{"IN", "India"},
            new String[]{"ZA", "South Africa"},
            new String[]{"SE", "Sweden"},
            new String[]{"NO", "Norway"},
            new String[]{"FI", "Finland"},
            new String[]{"DK", "Denmark"},
            new String[]{"BE", "Belgium"},
            new String[]{"CH", "Switzerland"},
            new String[]{"AT", "Austria"}
    ));

    private final CopyOnWriteArrayList<String> unknownTypes = new CopyOnWriteArrayList<>(Arrays.asList(
            "APPLE_PAY", "GOOGLE_PAY", "CRYPTO_TRANSFER",
            "REVOLUT_TRANSFER", "PAYPAL_PAYMENT", "ATM_REVERSAL", "INTERNAL_ADJUSTMENT"
    ));

    // Fixed — changing currencies would break Spark validation logic
    private static final List<String> CURRENCIES   = List.of("EUR", "GBP", "USD");
    private static final List<String> VALID_TYPES  = List.of(
            "CARD_PAYMENT", "CASH_WITHDRAWAL", "BANK_TRANSFER", "DIRECT_DEBIT", "REFUND"
    );

    // ── Generation methods ────────────────────────────────────────────────────

    public TransactionEvent generateValid() {
        String type = randomFrom(VALID_TYPES);
        return buildBase(type, null)
                .amount(randomAmount(BigDecimal.valueOf(1.00), BigDecimal.valueOf(500.00)))
                .merchant(type.equals("CARD_PAYMENT") ? randomFrom(new ArrayList<>(merchants)) : null)
                .build();
    }

    public TransactionEvent generateInvalid() {
        int scenario = RANDOM.nextInt(3);
        TransactionEvent.TransactionEventBuilder builder = buildBase(randomFrom(VALID_TYPES), null);
        switch (scenario) {
            case 0 -> builder.amount(BigDecimal.ZERO);
            case 1 -> builder.amount(BigDecimal.valueOf(-(RANDOM.nextDouble() * 500 + 0.01)).setScale(2, RoundingMode.HALF_UP));
            case 2 -> builder.accountId(null);
            default -> builder.amount(BigDecimal.ZERO);
        }
        return builder.build();
    }

    public TransactionEvent generateHighValue() {
        String type = randomFrom(List.of("BANK_TRANSFER", "CARD_PAYMENT", "DIRECT_DEBIT"));
        return buildBase(type, null)
                .amount(randomAmount(BigDecimal.valueOf(10_000.00), BigDecimal.valueOf(50_000.00)))
                .merchant(type.equals("CARD_PAYMENT") ? randomFrom(new ArrayList<>(merchants)) : null)
                .build();
    }

    public TransactionEvent generateUnknownType() {
        List<String> snapshot = new ArrayList<>(unknownTypes);
        if (snapshot.isEmpty()) snapshot.add("UNKNOWN_PAYMENT");
        String originalType = randomFrom(snapshot);
        return buildBase("UNKNOWN", originalType)
                .amount(randomAmount(BigDecimal.valueOf(1.00), BigDecimal.valueOf(500.00)))
                .build();
    }

    // ── Config exposure ───────────────────────────────────────────────────────

    public GeneratorConfigDto getConfig() {
        List<GeneratorConfigDto.CountryEntry> countryEntries = new ArrayList<>(countries).stream()
                .map(c -> new GeneratorConfigDto.CountryEntry(c[0], c[1]))
                .collect(Collectors.toList());

        return GeneratorConfigDto.builder()
                .merchants(new ArrayList<>(merchants))
                .countries(countryEntries)
                .unknownTypes(new ArrayList<>(unknownTypes))
                .currencies(CURRENCIES)
                .validTypes(VALID_TYPES)
                .build();
    }

    // ── Merchants ─────────────────────────────────────────────────────────────

    public boolean addMerchant(String merchant) {
        if (merchant == null || merchant.isBlank()) return false;
        String trimmed = merchant.trim();
        if (merchants.contains(trimmed)) return false;
        merchants.add(trimmed);
        return true;
    }

    public boolean removeMerchant(String merchant) {
        return merchants.remove(merchant);
    }

    // ── Countries ─────────────────────────────────────────────────────────────

    public boolean addCountry(String code, String name) {
        if (code == null || code.isBlank() || name == null || name.isBlank()) return false;
        String trimmedCode = code.trim().toUpperCase();
        boolean exists = countries.stream().anyMatch(c -> c[0].equalsIgnoreCase(trimmedCode));
        if (exists) return false;
        countries.add(new String[]{trimmedCode, name.trim()});
        return true;
    }

    public boolean removeCountry(String code) {
        if (code == null) return false;
        return countries.removeIf(c -> c[0].equalsIgnoreCase(code.trim()));
    }

    // ── Unknown types ─────────────────────────────────────────────────────────

    public boolean addUnknownType(String type) {
        if (type == null || type.isBlank()) return false;
        String trimmed = type.trim().toUpperCase();
        if (unknownTypes.contains(trimmed)) return false;
        unknownTypes.add(trimmed);
        return true;
    }

    public boolean removeUnknownType(String type) {
        return unknownTypes.remove(type);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private TransactionEvent.TransactionEventBuilder buildBase(String transactionType, String originalTransactionType) {
        List<String[]> snapshot = new ArrayList<>(countries);
        if (snapshot.isEmpty()) snapshot.add(new String[]{"XX", "Unknown"});
        String[] country = randomFrom(snapshot);
        int accountNum  = 10_001 + RANDOM.nextInt(90_000);
        int customerNum = 50_001 + RANDOM.nextInt(90_000);

        return TransactionEvent.builder()
                .transactionId(UuidGenerator.generateTransactionId())
                .accountId("ACC-" + accountNum)
                .customerId("CUS-" + customerNum)
                .transactionType(transactionType)
                .originalTransactionType(originalTransactionType)
                .currency(randomFrom(CURRENCIES))
                .countryCode(country[0])
                .countryName(country[1])
                .createdAt(Instant.now());
    }

    private BigDecimal randomAmount(BigDecimal min, BigDecimal max) {
        double range = max.subtract(min).doubleValue();
        double value = min.doubleValue() + RANDOM.nextDouble() * range;
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private static <T> T randomFrom(List<T> list) {
        return list.get(RANDOM.nextInt(list.size()));
    }
}
