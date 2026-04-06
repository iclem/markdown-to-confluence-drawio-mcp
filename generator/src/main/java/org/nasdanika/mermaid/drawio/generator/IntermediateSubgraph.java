package org.nasdanika.mermaid.drawio.generator;

import java.util.List;

public record IntermediateSubgraph(
        String id,
        String label,
        List<String> nodeIds,
        String parentId) {
}
