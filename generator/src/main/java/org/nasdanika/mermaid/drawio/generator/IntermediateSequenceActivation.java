package org.nasdanika.mermaid.drawio.generator;

public record IntermediateSequenceActivation(
        String participantId,
        int startOrder,
        int endOrder,
        int depth) {
}
