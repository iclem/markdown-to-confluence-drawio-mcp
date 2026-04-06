package org.nasdanika.mermaid.drawio.generator;

public record IntermediateNode(
        String id,
        String label,
        String shape,
        String fillColor,
        String strokeColor,
        String fontColor,
        Integer x,
        Integer y,
        Integer width,
        Integer height) {

    public IntermediateNode(String id, String label, String shape) {
        this(id, label, shape, null, null, null, null, null, null, null);
    }

    public IntermediateNode(
            String id,
            String label,
            String shape,
            String fillColor,
            String strokeColor,
            String fontColor) {
        this(id, label, shape, fillColor, strokeColor, fontColor, null, null, null, null);
    }
}
