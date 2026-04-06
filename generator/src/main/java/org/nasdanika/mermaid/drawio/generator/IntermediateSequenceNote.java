package org.nasdanika.mermaid.drawio.generator;

import java.util.List;

public record IntermediateSequenceNote(
        int order,
        List<String> participantIds,
        String label,
        String placement) {
}
