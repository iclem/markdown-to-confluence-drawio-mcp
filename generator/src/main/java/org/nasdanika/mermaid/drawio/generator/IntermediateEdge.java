package org.nasdanika.mermaid.drawio.generator;

public record IntermediateEdge(
        String sourceId,
        String targetId,
        String label,
        String kind,
        java.util.List<IntermediatePoint> points) {

    public IntermediateEdge(String sourceId, String targetId, String label, String kind) {
        this(sourceId, targetId, label, kind, null);
    }
}
