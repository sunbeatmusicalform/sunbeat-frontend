import type { ReleaseIntakeTemplate, ReleaseIntakeFormValues } from "./types";

export const atabaqueTemplate: ReleaseIntakeTemplate = {
  id: "atabaque-release-intake-v2",
  version: 2,
  workspaceSlug: "atabaque",
  slogan: "Shine Brighter, Work Smarter.",
  successMessage:
    "Seu envio foi recebido com sucesso. O time da Atabaque dará continuidade ao fluxo operacional.",
  intro: {
    clientName: "Atabaque",
    formTitle: "New Release",
    introText:
      "Submit metadata for your next release. This intake was designed to reduce back-and-forth and organize the release operation.",
    logoUrl: "/clients/atabaque/logo.png",
    bannerUrl: "/clients/atabaque/banner.png",
  },
  steps: [
    {
      key: "intro",
      title: "Intro",
      description: "Start your release submission.",
      fields: [],
    },
    {
      key: "identification",
      title: "Identification",
      description: "Who is submitting this release.",
      fields: [
        {
          key: "submitter_name",
          type: "text",
          label: "Name",
          required: true,
          placeholder: "Your name",
        },
        {
          key: "submitter_email",
          type: "email",
          label: "Email",
          required: true,
          placeholder: "you@company.com",
        },
        {
          key: "project_title",
          type: "text",
          label: "Project Title",
          required: true,
          placeholder: "Release title",
        },
        {
          key: "release_type",
          type: "select",
          label: "Release Type",
          required: true,
          options: [
            { label: "Single", value: "single" },
            { label: "EP", value: "ep" },
            { label: "Album", value: "album" },
          ],
        },
      ],
    },
    {
      key: "release",
      title: "Release",
      description: "Main metadata for this release.",
      fields: [
        {
          key: "release_date",
          type: "date",
          label: "Release Date",
          required: true,
        },
        {
          key: "genre",
          type: "text",
          label: "Genre",
          required: true,
          placeholder: "Pop, Trap, Funk, MPB...",
        },
        {
          key: "explicit_content",
          type: "select",
          label: "Explicit Content",
          required: true,
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ],
        },
        {
          key: "tiktok_snippet",
          type: "text",
          label: "TikTok Snippet",
          placeholder: "Starts at 00:45",
        },
        {
          key: "presskit_link",
          type: "url",
          label: "Presskit Link",
          placeholder: "https://...",
        },
        {
          key: "has_video_asset",
          type: "select",
          label: "Video Asset",
          required: true,
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
            { label: "Unknown", value: "unknown" },
          ],
        },
        {
          key: "cover_file",
          type: "file",
          label: "Cover Upload",
          required: true,
          helperText: "Idealmente 3000x3000.",
        },
      ],
    },
    {
      key: "tracks",
      title: "Tracks",
      description: "Track list and detailed metadata.",
      fields: [],
    },
    {
      key: "marketing",
      title: "Marketing",
      description: "Campaign and release context.",
      fields: [
        {
          key: "marketing_numbers",
          type: "textarea",
          label: "Marketing Numbers",
          required: true,
        },
        {
          key: "marketing_focus",
          type: "textarea",
          label: "Marketing Focus",
          required: true,
        },
        {
          key: "marketing_objectives",
          type: "textarea",
          label: "Marketing Objectives",
          required: true,
        },
        {
          key: "marketing_budget",
          type: "text",
          label: "Marketing Budget",
          placeholder: "Ex.: R$ 2.000",
        },
        {
          key: "focus_track_name",
          type: "text",
          label: "Focus Track Name",
          placeholder: "Track 3",
        },
        {
          key: "date_flexibility",
          type: "text",
          label: "Release Flexibility",
          required: true,
          placeholder: "Ex.: yes / no / depends",
        },
        {
          key: "has_special_guests",
          type: "select",
          label: "Special Guests",
          required: true,
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ],
        },
        {
          key: "promotion_participants",
          type: "text",
          label: "Promotion Participants",
          required: true,
          placeholder: "Influencers, creators, brands...",
        },
        {
          key: "lyrics",
          type: "textarea",
          label: "General Lyrics / Notes",
        },
        {
          key: "general_notes",
          type: "textarea",
          label: "General Notes",
        },
        {
          key: "additional_files",
          type: "file",
          label: "Additional Files",
        },
      ],
    },
    {
      key: "review_submit",
      title: "Review",
      description: "Final review before submission.",
      fields: [],
    },
  ],
};

export function createInitialReleaseIntakeValues(): ReleaseIntakeFormValues {
  return {
    identification: {
      submitter_name: "",
      submitter_email: "",
      project_title: "",
      release_type: "",
    },
    project: {
      release_date: "",
      genre: "",
      explicit_content: "",
      tiktok_snippet: "",
      presskit_link: "",
      has_video_asset: "",
      cover_file: null,
    },
    tracks: [],
    marketing: {
      marketing_numbers: "",
      marketing_focus: "",
      marketing_objectives: "",
      marketing_budget: "",
      focus_track_name: "",
      date_flexibility: "",
      has_special_guests: "",
      promotion_participants: "",
      lyrics: "",
      general_notes: "",
      additional_files: [],
    },
  };
}