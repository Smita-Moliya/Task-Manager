from rest_framework import serializers


class AttachmentUploadSerializer(serializers.Serializer):
    files = serializers.ListField(
        child=serializers.FileField(),
        required=True,
        allow_empty=False
    )

    def validate_files(self, value):
        if not value:
            raise serializers.ValidationError("No files uploaded")

        if len(value) > 5:
            raise serializers.ValidationError("Maximum 5 files allowed")

        allowed_types = {
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/jpg",
        }

        max_size = 10 * 1024 * 1024  # 10 MB

        for f in value:
            content_type = getattr(f, "content_type", None)
            size = getattr(f, "size", 0)

            if content_type not in allowed_types:
                raise serializers.ValidationError(
                    f"Unsupported file type: {f.name}"
                )

            if size > max_size:
                raise serializers.ValidationError(
                    f"File too large: {f.name}. Max 10 MB allowed"
                )

        return value