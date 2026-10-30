import type { Resolvers } from "@/lib/apollo/__generated__/resolvers-types";

export const usersResolvers: Resolvers = {
  // A field resolver: the lookup only runs for a query that asks for the host.
  Booking: {
    host: (booking, _, { loaders }) => {
      const hostId = booking.listing?.host_id;
      return hostId ? loaders.userSummary.load(hostId) : null;
    },
    guest: (booking, _, { loaders }) => loaders.userSummary.load(booking.guest_id),
  },
  Conversation: {
    counterpart: (row, _, { loaders }) =>
      row.counterpart_id ? loaders.userSummary.load(row.counterpart_id) : null,
  },
  ChatThread: {
    counterpart: (thread, _, { loaders }) =>
      thread.counterpart_id ? loaders.userSummary.load(thread.counterpart_id) : null,
  },
};
